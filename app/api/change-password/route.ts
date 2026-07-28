import bcrypt from "bcryptjs";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth/require-session";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { changePasswordSchema } from "@/lib/validation/change-password";

export async function POST(
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
      changePasswordSchema.safeParse(
        body
      );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.error.issues[0]
              ?.message ??
            "Invalid password details.",
          errors:
            result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User account not found.",
        },
        { status: 404 }
      );
    }

    const currentPasswordMatches =
      await bcrypt.compare(
        result.data.currentPassword,
        user.passwordHash
      );

    if (!currentPasswordMatches) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Current password is incorrect.",
        },
        { status: 400 }
      );
    }

    const newPasswordMatchesOld =
      await bcrypt.compare(
        result.data.newPassword,
        user.passwordHash
      );

    if (newPasswordMatchesOld) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password must be different from your current password.",
        },
        { status: 400 }
      );
    }

    const passwordHash =
      await bcrypt.hash(
        result.data.newPassword,
        12
      );

    await prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        passwordHash,

        sessionVersion: {
          increment: 1,
        },
      },
    });

    /*
     * Sign out the current browser after
     * changing the password.
     */
    const cookieStore =
      await cookies();

    cookieStore.delete(
      SESSION_COOKIE_NAME
    );

    return NextResponse.json({
      success: true,
      message:
        "Password changed successfully. Please sign in again.",
    });
  } catch (error) {
    console.error(
      "Password change error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to change password.",
      },
      { status: 500 }
    );
  }
}
