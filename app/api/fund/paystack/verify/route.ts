import { NextResponse } from "next/server";

import {
  getAuthenticatedUserId,
} from "@/lib/auth/require-session";

import {
  verifyPaystackTransaction,
} from "@/lib/paystack";

import { prisma } from "@/lib/prisma";

export async function GET(
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

    const url =
      new URL(request.url);

    const reference =
      url.searchParams.get(
        "reference"
      );

    if (!reference) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment reference is missing.",
        },
        { status: 400 }
      );
    }

    const attempt =
      await prisma.fundingAttempt.findUnique({
        where: {
          reference,
        },
      });

    if (
      !attempt ||
      attempt.userId !== userId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment attempt not found.",
        },
        { status: 404 }
      );
    }

    const payment =
      await verifyPaystackTransaction(
        reference
      );

    const expectedKobo =
      Math.round(
        Number(
          attempt.amount
        ) * 100
      );

    const referenceMatches =
      payment.reference ===
      attempt.reference;

    const amountMatches =
      payment.amount ===
      expectedKobo;

    const currencyMatches =
      payment.currency ===
      attempt.currency;

    const successful =
      payment.status ===
        "success" &&
      referenceMatches &&
      amountMatches &&
      currencyMatches;

    /*
     * Do NOT mark our funding attempt
     * SUCCESSFUL yet.
     *
     * Day 46 webhook processing will
     * perform the wallet credit.
     */

    return NextResponse.json({
      success: true,

      payment: {
        verified:
          successful,

        paystackStatus:
          payment.status,

        reference:
          payment.reference,

        amount:
          Number(
            attempt.amount
          ),

        currency:
          attempt.currency,

        channel:
          payment.channel,

        walletCredited:
          attempt.status ===
            "SUCCESSFUL",
      },
    });
  } catch (error) {
    console.error(
      "Paystack verification error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to verify payment.",
      },
      { status: 500 }
    );
  }
}
