import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import {
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session-cookie";
import {
  hashPasswordResetToken,
} from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import {
  resetPasswordSchema,
} from "@/lib/validation/password-reset";

export async function POST(
  request: Request
) {
  try {
    let body: unknown;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid request.",
        },
        { status: 400 }
      );
    }

    const result =
      resetPasswordSchema.safeParse(
        body
      );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.error.issues[0]
              ?.message ??
            "Invalid password reset request.",
          errors:
            result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const tokenHash =
      hashPasswordResetToken(
        result.data.token
      );

    const resetToken =
      await prisma.passwordResetToken.findUnique({
        where: {
          tokenHash,
        },

        select: {
          id: true,
          userId: true,
          usedAt: true,
          expiresAt: true,
        },
      });

    const now = new Date();

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt <= now
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This password reset link is invalid or has expired.",
        },
        { status: 400 }
      );
    }

    const passwordHash =
      await hash(
        result.data.password,
        12
      );

    try {
      await prisma.$transaction(
        async (tx) => {
          // Claim the token atomically.
          const claimed =
            await tx.passwordResetToken.updateMany({
              where: {
                id: resetToken.id,
                usedAt: null,
                expiresAt: {
                  gt: now,
                },
              },

              data: {
                usedAt: now,
              },
            });

          if (
            claimed.count !== 1
          ) {
            throw new Error(
              "RESET_TOKEN_INVALID"
            );
          }

          await tx.user.update({
            where: {
              id:
                resetToken.userId,
            },

            data: {
              passwordHash,

              sessionVersion: {
                increment: 1,
              },
            },
          });

          // Kill every currently
          // active session.
          await tx.session.updateMany({
            where: {
              userId:
                resetToken.userId,
              revokedAt: null,
            },

            data: {
              revokedAt: now,
            },
          });

          // Invalidate any other
          // unused reset links.
          await tx.passwordResetToken.updateMany({
            where: {
              userId:
                resetToken.userId,
              usedAt: null,
            },

            data: {
              usedAt: now,
            },
          });
        },
        {
          isolationLevel:
            "Serializable",
        }
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "RESET_TOKEN_INVALID"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This password reset link is invalid or has expired.",
          },
          { status: 400 }
        );
      }

      throw error;
    }

    await writeAuditLog({
      request,
      userId:
        resetToken.userId,
      action:
        "PASSWORD_RESET_COMPLETED",
      success: true,
      entityType: "USER",
      entityId:
        resetToken.userId,
    });

    const response =
      NextResponse.json({
        success: true,
        message:
          "Password reset successfully. Please sign in again.",
      });

    response.cookies.set({
      name:
        SESSION_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error(
      "Password reset error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to reset password.",
      },
      { status: 500 }
    );
  }
}
