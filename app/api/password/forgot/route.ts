import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import {
  issuePasswordResetToken,
} from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import {
  forgotPasswordSchema,
} from "@/lib/validation/password-reset";

const GENERIC_MESSAGE =
  "If an account exists for that email, password reset instructions will be sent.";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const attempts = new Map<
  string,
  RateLimitEntry
>();

const WINDOW_MS =
  15 * 60 * 1000;

const MAX_REQUESTS = 3;

function isRateLimited(
  key: string
) {
  const now = Date.now();
  const existing =
    attempts.get(key);

  if (
    !existing ||
    existing.resetAt <= now
  ) {
    attempts.set(key, {
      count: 1,
      resetAt:
        now + WINDOW_MS,
    });

    return false;
  }

  existing.count += 1;

  attempts.set(
    key,
    existing
  );

  return (
    existing.count >
    MAX_REQUESTS
  );
}

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
      forgotPasswordSchema.safeParse(
        body
      );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.error.issues[0]
              ?.message ??
            "Invalid email address.",
        },
        { status: 400 }
      );
    }

    const email =
      result.data.email;

    // Same response whether limited,
    // existing account, or unknown account.
    if (isRateLimited(email)) {
      return NextResponse.json({
        success: true,
        message:
          GENERIC_MESSAGE,
      });
    }

    const user =
      await prisma.user.findUnique({
        where: {
          email,
        },

        select: {
          id: true,
        },
      });

    if (user) {
      await issuePasswordResetToken(
        user.id
      );

      await writeAuditLog({
        request,
        userId: user.id,
        action:
          "PASSWORD_RESET_REQUESTED",
        success: true,
        entityType: "USER",
        entityId: user.id,
      });
    }

    return NextResponse.json({
      success: true,
      message:
        GENERIC_MESSAGE,
    });
  } catch (error) {
    console.error(
      "Forgot password error:",
      error
    );

    // Do not reveal whether
    // the email exists.
    return NextResponse.json({
      success: true,
      message:
        GENERIC_MESSAGE,
    });
  }
}
