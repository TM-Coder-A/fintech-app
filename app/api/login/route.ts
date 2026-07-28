import bcrypt from "bcryptjs";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSessionToken } from "@/lib/session";
import { loginSchema } from "@/lib/validation/login";

import {
  checkLoginRateLimit,
  clearLoginAttempts,
  recordFailedLogin,
} from "@/lib/auth/login-rate-limit";

import {
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session-cookie";

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const result =
      loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid login details.",
        },
        {
          status: 400,
        }
      );
    }

    const email =
      result.data.email
        .trim()
        .toLowerCase();

    /*
     * For our current development
     * environment we rate-limit by email.
     *
     * Production will later use a durable
     * rate limiter with multiple signals.
     */
    const rateLimitKey =
      `login:${email}`;

    const rateLimit =
      checkLoginRateLimit(
        rateLimitKey
      );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Too many login attempts. Please try again later.",
          retryAfterSeconds:
            rateLimit.retryAfterSeconds,
        },
        {
          status: 429,

          headers: {
            "Retry-After": String(
              rateLimit.retryAfterSeconds ??
                900
            ),
          },
        }
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          email,
        },

        include: {
          wallet: true,
        },
      });

    if (!user) {
      recordFailedLogin(
        rateLimitKey
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid email or password.",
        },
        {
          status: 401,
        }
      );
    }

    const passwordMatches =
      await bcrypt.compare(
        result.data.password,
        user.passwordHash
      );

    if (!passwordMatches) {
      recordFailedLogin(
        rateLimitKey
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid email or password.",
        },
        {
          status: 401,
        }
      );
    }

    clearLoginAttempts(
      rateLimitKey
    );

    const sessionToken =
      await createSessionToken({
        userId: user.id,
        email: user.email,
      });

    const cookieStore =
      await cookies();

    cookieStore.set(
      SESSION_COOKIE_NAME,
      sessionToken,
      getSessionCookieOptions()
    );

    return NextResponse.json({
      success: true,

      message:
        "Login successful.",

      user: {
        id: user.id,
        firstName:
          user.firstName,
        lastName:
          user.lastName,
        email: user.email,

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
      "Login error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to log in.",
      },
      {
        status: 500,
      }
    );
  }
}
