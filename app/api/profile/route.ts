import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { getAuthenticatedUserId } from "@/lib/auth/require-session";
import { profileSchema } from "@/lib/validation/profile";

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
        { status: 401 }
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
        { status: 404 }
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
              currency:
                user.wallet.currency,
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
        message:
          "Unable to load profile.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request
) {
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
        { status: 401 }
      );
    }

    const body =
      await request.json();

    const result =
      profileSchema.safeParse(
        body
      );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Validation failed.",
          errors:
            result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const currentUser =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User not found.",
        },
        { status: 404 }
      );
    }

    const existingPhone =
      await prisma.user.findFirst({
        where: {
          phone:
            result.data.phone,

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

    const changedFields: string[] =
      [];

    if (
      currentUser.firstName !==
      result.data.firstName
    ) {
      changedFields.push(
        "firstName"
      );
    }

    if (
      currentUser.lastName !==
      result.data.lastName
    ) {
      changedFields.push(
        "lastName"
      );
    }

    if (
      currentUser.phone !==
      result.data.phone
    ) {
      changedFields.push(
        "phone"
      );
    }

    const user =
      await prisma.user.update({
        where: {
          id: userId,
        },

        data: {
          firstName:
            result.data.firstName,
          lastName:
            result.data.lastName,
          phone:
            result.data.phone,
        },
      });

    await writeAuditLog({
      request,
      userId,
      action: "PROFILE_UPDATE",
      entityType: "USER",
      entityId: user.id,

      metadata: {
        changedFields:
          changedFields.length
            ? changedFields.join(",")
            : "none",
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Profile updated successfully.",

      user: {
        firstName:
          user.firstName,
        lastName:
          user.lastName,
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
        message:
          "Unable to update profile.",
      },
      { status: 500 }
    );
  }
}
