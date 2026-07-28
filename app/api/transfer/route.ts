import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth/require-session";
import { transferSchema } from "@/lib/validation/transfer";

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

    const result =
      transferSchema.safeParse(body);

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
      accountNumber,
      amount,
      narration,
      idempotencyKey,
    } = result.data;

    /*
     * If this exact transfer request was already
     * processed, return the original result instead
     * of debiting again.
     */
    const existingTransaction =
      await prisma.transaction.findUnique({
        where: {
          idempotencyKey,
        },
        include: {
          receiverWallet: {
            include: {
              user: true,
            },
          },
        },
      });

    if (existingTransaction) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        message:
          "Transfer was already processed.",
        transaction: {
          reference:
            existingTransaction.reference,
          amount:
            existingTransaction.amount.toString(),
          recipient:
            existingTransaction.receiverWallet
              ? `${existingTransaction.receiverWallet.user.firstName} ${existingTransaction.receiverWallet.user.lastName}`
              : "Recipient",
        },
      });
    }

    const sender =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          wallet: true,
        },
      });

    if (!sender?.wallet) {
      return NextResponse.json(
        {
          success: false,
          message: "Sender wallet not found.",
        },
        { status: 404 }
      );
    }

    const receiverWallet =
      await prisma.wallet.findUnique({
        where: {
          accountNumber,
        },
        include: {
          user: true,
        },
      });

    if (!receiverWallet) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Recipient account not found.",
        },
        { status: 404 }
      );
    }

    if (
      receiverWallet.id === sender.wallet.id
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You cannot transfer money to your own wallet.",
        },
        { status: 400 }
      );
    }

    if (
      receiverWallet.currency !==
      sender.wallet.currency
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Wallet currencies do not match.",
        },
        { status: 400 }
      );
    }

    const reference =
      `TX-${randomUUID()}`;

    const transaction =
      await prisma.$transaction(
        async (tx) => {
          /*
           * Atomic conditional debit.
           *
           * This succeeds only when the current
           * balance is still >= amount.
           */
          const senderDebit =
            await tx.wallet.updateMany({
              where: {
                id: sender.wallet!.id,
                balance: {
                  gte: amount,
                },
              },

              data: {
                balance: {
                  decrement: amount,
                },
              },
            });

          if (senderDebit.count !== 1) {
            throw new Error(
              "INSUFFICIENT_BALANCE"
            );
          }

          await tx.wallet.update({
            where: {
              id: receiverWallet.id,
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
              narration,
              type: "TRANSFER",
              status: "SUCCESSFUL",
              senderWalletId:
                sender.wallet!.id,
              receiverWalletId:
                receiverWallet.id,
            },
          });
        }
      );

    return NextResponse.json(
      {
        success: true,
        duplicate: false,
        message:
          "Transfer completed successfully.",

        transaction: {
          reference:
            transaction.reference,

          amount:
            transaction.amount.toString(),

          recipient:
            `${receiverWallet.user.firstName} ${receiverWallet.user.lastName}`,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "INSUFFICIENT_BALANCE"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Insufficient balance.",
        },
        { status: 400 }
      );
    }

    /*
     * A concurrent duplicate request may hit
     * the unique idempotency constraint.
     * It will roll back automatically.
     */
    console.error(
      "Transfer error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to complete transfer.",
      },
      { status: 500 }
    );
  }
}
