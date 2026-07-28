import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth/require-session";
import { fundingSchema } from "@/lib/validation/funding";

export async function POST(request: Request) {
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

    const body = await request.json();
    const result = fundingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed.",
          errors: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      amount,
      idempotencyKey,
    } = result.data;

    const existingTransaction =
      await prisma.transaction.findUnique({
        where: {
          idempotencyKey,
        },
      });

    if (existingTransaction) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: "Funding request was already processed.",
        transaction: {
          reference: existingTransaction.reference,
          amount: existingTransaction.amount.toString(),
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        wallet: true,
      },
    });

    if (!user?.wallet) {
      return NextResponse.json(
        {
          success: false,
          message: "Wallet not found.",
        },
        { status: 404 }
      );
    }

    const reference = `FD-${randomUUID()}`;

    const transaction = await prisma.$transaction(
      async (tx) => {
        await tx.wallet.update({
          where: {
            id: user.wallet!.id,
          },
          data: {
            balance: {
              increment: amount,
            },
          },
        });

        return tx.transaction.create({
          data: {
            reference,
            idempotencyKey,
            amount,
            narration: "Development wallet funding",
            type: "FUNDING",
            status: "SUCCESSFUL",
            receiverWalletId: user.wallet!.id,
          },
        });
      }
    );

    return NextResponse.json(
      {
        success: true,
        duplicate: false,
        message: "Wallet funded successfully.",
        transaction: {
          reference: transaction.reference,
          amount: transaction.amount.toString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Funding error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fund wallet.",
      },
      { status: 500 }
    );
  }
}
