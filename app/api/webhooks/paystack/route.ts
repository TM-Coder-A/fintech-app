import { NextResponse } from "next/server";

import {
  creditPaystackFunding,
  PermanentPaymentError,
  UnknownFundingAttemptError,
} from "@/lib/paystack-credit";

import {
  verifyPaystackWebhookSignature,
} from "@/lib/paystack-webhook";

type PaystackEvent = {
  event?: string;

  data?: {
    reference?: string;
  };
};

export async function POST(
  request: Request
) {
  /*
   * Do not call request.json() before
   * validating the signature.
   */
  const rawBody =
    await request.text();

  const signature =
    request.headers.get(
      "x-paystack-signature"
    );

  if (
    !verifyPaystackWebhookSignature(
      rawBody,
      signature
    )
  ) {
    console.warn(
      "Rejected Paystack webhook: invalid signature."
    );

    return NextResponse.json(
      {
        received: false,
      },
      {
        status: 401,
      }
    );
  }

  let event: PaystackEvent;

  try {
    event =
      JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      {
        received: false,
      },
      {
        status: 400,
      }
    );
  }

  /*
   * Other Paystack events are acknowledged
   * but do not affect wallet balances.
   */
  if (
    event.event !==
    "charge.success"
  ) {
    return NextResponse.json({
      received: true,
      ignored: true,
    });
  }

  const reference =
    event.data?.reference;

  if (!reference) {
    return NextResponse.json({
      received: true,
      ignored: true,
      reason:
        "missing_reference",
    });
  }

  try {
    const result =
      await creditPaystackFunding(
        reference
      );

    console.log(
      result.duplicate
        ? `Paystack webhook duplicate ignored: ${reference}`
        : `Paystack funding credited: ${reference}`
    );

    return NextResponse.json({
      received: true,
      credited:
        result.credited,
      duplicate:
        result.duplicate,
    });
  } catch (
    error
  ) {
    /*
     * An unknown reference may belong to
     * another product using the same
     * Paystack account. Never create money.
     */
    if (
      error instanceof
      UnknownFundingAttemptError
    ) {
      console.warn(
        `Unknown Paystack reference ignored: ${reference}`
      );

      return NextResponse.json({
        received: true,
        ignored: true,
      });
    }

    /*
     * Permanent validation failures should
     * never credit a wallet and don't
     * improve by repeatedly retrying.
     */
    if (
      error instanceof
      PermanentPaymentError
    ) {
      console.error(
        `Paystack payment rejected: ${reference}`,
        error.message
      );

      return NextResponse.json({
        received: true,
        credited: false,
        rejected: true,
      });
    }

    /*
     * Transient database/network failure:
     * return non-200 so Paystack retries.
     */
    console.error(
      "Paystack webhook processing failed:",
      error
    );

    return NextResponse.json(
      {
        received: false,
      },
      {
        status: 500,
      }
    );
  }
}
