import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import {
  getAuthenticatedUserId,
} from "@/lib/auth/require-session";
import {
  issueEmailVerificationToken,
} from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";

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
          message: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          emailVerified: true,
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

    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message:
          "Your email is already verified.",
      });
    }

    await issueEmailVerificationToken(
      userId
    );

    await writeAuditLog({
      request,
      userId,
      action:
        "EMAIL_VERIFICATION_REQUESTED",
      success: true,
      entityType: "USER",
      entityId: userId,
    });

    return NextResponse.json({
      success: true,
      message:
        "A new email verification request has been created.",
    });
  } catch (error) {
    console.error(
      "Verification resend error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create a new verification request.",
      },
      { status: 500 }
    );
  }
}
