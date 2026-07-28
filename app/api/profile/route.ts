import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/session";
import { profileSchema } from "@/lib/validation/profile";

async function getSessionUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  return session?.userId ?? null;
}

export async function GET() {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
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
          message: "User not found.",
        },
        { status: 404 }
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
    console.error(
      "Profile lookup error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load profile.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request
) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const result =
      profileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed.",
          errors: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const existingPhone =
      await prisma.user.findFirst({
        where: {
          phone: result.data.phone,

          NOT: {
            id: userId,
          },
        },
      });

    if (existingPhone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "That phone number is already in use.",
        },
        { status: 409 }
      );
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        phone: result.data.phone,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",

      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error(
      "Profile update error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update profile.",
      },
      { status: 500 }
    );
  }
}
