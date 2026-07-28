import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated.",
        },
        {
          status: 401,
        }
      );
    }

    const session =
      await verifySessionToken(token);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired session.",
        },
        {
          status: 401,
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      include: {
        wallet: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
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
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        wallet: user.wallet
          ? {
              accountNumber:
                user.wallet.accountNumber,
              currency: user.wallet.currency,
              balance:
                user.wallet.balance.toString(),
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Session lookup error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to read session.",
      },
      {
        status: 500,
      }
    );
  }
}
