import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import {
  hashEmailVerificationToken,
} from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";
import {
  verifyEmailSchema,
} from "@/lib/validation/email-verification";

export async function POST(
  request: Request
) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request.",
        },
        { status: 400 }
      );
    }

    const result =
      verifyEmailSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.error.issues[0]
              ?.message ??
            "Invalid verification link.",
        },
        { status: 400 }
      );
    }

    const tokenHash =
      hashEmailVerificationToken(
        result.data.token
      );

    const token =
      await prisma.emailVerificationToken.findUnique({
        where: {
          tokenHash,
        },

        select: {
          id: true,
          userId: true,
          expiresAt: true,
          usedAt: true,

          user: {
            select: {
              emailVerified: true,
            },
          },
        },
      });

    const now = new Date();

    if (
      !token ||
      token.usedAt ||
      token.expiresAt <= now
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This verification link is invalid or has expired.",
        },
        { status: 400 }
      );
    }

    try {
      await prisma.$transaction(
        async (tx) => {
          const claimed =
            await tx.emailVerificationToken.updateMany({
              where: {
                id: token.id,
                usedAt: null,

                expiresAt: {
                  gt: now,
                },
              },

              data: {
                usedAt: now,
              },
            });

          if (claimed.count !== 1) {
            throw new Error(
              "VERIFICATION_TOKEN_INVALID"
            );
          }

          await tx.user.update({
            where: {
              id: token.userId,
            },

            data: {
              emailVerified: true,
              emailVerifiedAt: now,
            },
          });

          await tx.emailVerificationToken.updateMany({
            where: {
              userId: token.userId,
              usedAt: null,
            },

            data: {
              usedAt: now,
            },
          });
        },
        {
          isolationLevel: "Serializable",
        }
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "VERIFICATION_TOKEN_INVALID"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This verification link is invalid or has expired.",
          },
          { status: 400 }
        );
      }

      throw error;
    }

    await writeAuditLog({
      request,
      userId: token.userId,
      action: "EMAIL_VERIFIED",
      success: true,
      entityType: "USER",
      entityId: token.userId,
    });

    return NextResponse.json({
      success: true,
      message:
        "Your email has been verified successfully.",
    });
  } catch (error) {
    console.error(
      "Email verification error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to verify email.",
      },
      { status: 500 }
    );
  }
}
