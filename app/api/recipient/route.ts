import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth/require-session";

export async function GET(request: Request) {
  try {
    const userId =
      await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const accountNumber =
      searchParams
        .get("accountNumber")
        ?.trim() ?? "";

    if (!/^\d{10}$/.test(accountNumber)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Account number must be exactly 10 digits.",
        },
        { status: 400 }
      );
    }

    const wallet =
      await prisma.wallet.findUnique({
        where: {
          accountNumber,
        },

        include: {
          user: true,
        },
      });

    if (!wallet) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Recipient account not found.",
        },
        { status: 404 }
      );
    }

    if (wallet.userId === userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You cannot transfer money to your own wallet.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,

      recipient: {
        name:
          `${wallet.user.firstName} ${wallet.user.lastName}`,

        accountNumber:
          wallet.accountNumber,
      },
    });
  } catch (error) {
    console.error(
      "Recipient lookup error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to look up recipient.",
      },
      { status: 500 }
    );
  }
}
