import {
  randomUUID,
} from "crypto";

import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";

import {
  getAuthenticatedUserId,
} from "@/lib/auth/require-session";

import {
  initializePaystackTransaction,
} from "@/lib/paystack";

import { prisma } from "@/lib/prisma";

import {
  paystackFundingSchema,
} from "@/lib/validation/paystack-funding";

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
      paystackFundingSchema.safeParse(
        body
      );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.error.issues[0]
              ?.message ??
            "Invalid payment request.",
        },
        { status: 400 }
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          email: true,
          emailVerified: true,

          wallet: {
            select: {
              id: true,
              currency: true,
            },
          },
        },
      });

    if (!user?.wallet) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Wallet not found.",
        },
        { status: 404 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Verify your email before funding your wallet.",
        },
        { status: 403 }
      );
    }

    if (
      user.wallet.currency !==
      "NGN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Paystack funding currently supports NGN wallets only.",
        },
        { status: 400 }
      );
    }

    const {
      amount,
      idempotencyKey,
    } = result.data;

    const existing =
      await prisma.fundingAttempt.findUnique({
        where: {
          idempotencyKey,
        },
      });

    if (existing) {
      if (
        existing.userId !== userId
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Payment request conflict.",
          },
          { status: 409 }
        );
      }

      if (
        existing.authorizationUrl
      ) {
        return NextResponse.json({
          success: true,
          duplicate: true,

          authorizationUrl:
            existing.authorizationUrl,

          reference:
            existing.reference,
        });
      }
    }

    const amountKobo =
      Math.round(
        amount * 100
      );

    const storedAmount =
      amountKobo / 100;

    const reference =
      `FUND-${randomUUID()}`;

    const origin =
      process.env.APP_URL
        ?.replace(/\/$/, "") ??
      new URL(
        request.url
      ).origin;

    const callbackUrl =
      `${origin}/fund/paystack/callback`;

    const attempt =
      await prisma.fundingAttempt.create({
        data: {
          userId,
          walletId:
            user.wallet.id,

          idempotencyKey,
          reference,

          amount:
            storedAmount,

          currency:
            "NGN",

          provider:
            "PAYSTACK",

          status:
            "PENDING",
        },
      });

    try {
      const paystack =
        await initializePaystackTransaction({
          email:
            user.email,

          amountKobo,

          reference,

          callbackUrl,

          metadata: {
            fundingAttemptId:
              attempt.id,

            walletId:
              user.wallet.id,
          },
        });

      if (
        paystack.reference !==
        reference
      ) {
        throw new Error(
          "Paystack reference mismatch."
        );
      }

      const updated =
        await prisma.fundingAttempt.update({
          where: {
            id:
              attempt.id,
          },

          data: {
            authorizationUrl:
              paystack.authorization_url,

            accessCode:
              paystack.access_code,
          },
        });

      await writeAuditLog({
        request,
        userId,
        action:
          "PAYSTACK_FUNDING_INITIALIZED",

        success: true,

        entityType:
          "FUNDING_ATTEMPT",

        entityId:
          attempt.id,

        metadata: {
          reference,
          amount:
            String(
              storedAmount
            ),
          currency:
            "NGN",
        },
      });

      return NextResponse.json({
        success: true,
        duplicate: false,

        authorizationUrl:
          updated.authorizationUrl,

        reference:
          updated.reference,
      });
    } catch (error) {
      await prisma.fundingAttempt.update({
        where: {
          id:
            attempt.id,
        },

        data: {
          status:
            "FAILED",
        },
      });

      throw error;
    }
  } catch (error) {
    console.error(
      "Paystack initialization error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to start Paystack payment.",
      },
      { status: 500 }
    );
  }
}
