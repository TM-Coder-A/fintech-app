import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth/require-session";

export async function GET() {
  try {
    const userId =
      await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Not authenticated.",
        },
        {
          status: 401,
        }
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },

        include: {
          wallet: true,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,

      user: {
        id: user.id,
        firstName:
          user.firstName,
        lastName:
          user.lastName,
        email: user.email,
        phone: user.phone,

        wallet: user.wallet
          ? {
              accountNumber:
                user.wallet
                  .accountNumber,

              balance:
                user.wallet.balance.toString(),

              currency:
                user.wallet.currency,
            }
          : null,
      },
    });
  } catch (error) {
    console.error(
      "Current user error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load account.",
      },
      {
        status: 500,
      }
    );
  }
}
