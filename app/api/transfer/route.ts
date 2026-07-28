import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { getAuthenticatedUserId } from "@/lib/auth/require-session";
import { transferSchema } from "@/lib/validation/transfer";

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function POST(request: Request) {
  try {
    const userId =
      await getAuthenticatedUserId();

    if (!userId) {
      await writeAuditLog({
        request,
        action: "TRANSFER_FAILURE",
        success: false,
        metadata: {
          reason: "not_authenticated",
        },
      });

      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      await writeAuditLog({
        request,
        userId,
        action: "TRANSFER_FAILURE",
        success: false,
        metadata: {
          reason: "invalid_json",
        },
      });

      return NextResponse.json(
        {
          success: false,
          message: "Invalid request.",
        },
        { status: 400 }
      );
    }

    const result =
      transferSchema.safeParse(body);

    if (!result.success) {
      await writeAuditLog({
        request,
        userId,
        action: "TRANSFER_FAILURE",
        success: false,
        metadata: {
          reason: "validation_failed",
        },
      });

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
      await writeAuditLog({
        request,
        userId,
        action: "TRANSFER_FAILURE",
        success: false,
        metadata: {
          reason: "sender_wallet_missing",
          amount,
        },
      });

      return NextResponse.json(
        {
          success: false,
          message: "Sender wallet not found.",
        },
        { status: 404 }
      );
    }

    /*
     * Check idempotency only after we know
     * which authenticated wallet owns the request.
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
      if (
        existingTransaction.senderWalletId !==
          sender.wallet.id ||
        existingTransaction.type !== "TRANSFER"
      ) {
        await writeAuditLog({
          request,
          userId,
          action: "TRANSFER_FAILURE",
          success: false,
          metadata: {
            reason: "idempotency_conflict",
          },
        });

        return NextResponse.json(
          {
            success: false,
            message:
              "Transfer request identifier conflict.",
          },
          { status: 409 }
        );
      }

      await writeAuditLog({
        request,
        userId,
        action: "TRANSFER_DUPLICATE",
        entityType: "TRANSACTION",
        entityId: existingTransaction.id,
        metadata: {
          reference:
            existingTransaction.reference,
        },
      });

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
      await writeAuditLog({
        request,
        userId,
        action: "TRANSFER_FAILURE",
        success: false,
        metadata: {
          reason: "recipient_not_found",
          amount,
          recipientLast4:
            accountNumber.slice(-4),
        },
      });

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
      await writeAuditLog({
        request,
        userId,
        action: "TRANSFER_FAILURE",
        success: false,
        metadata: {
          reason: "self_transfer",
          amount,
        },
      });

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
      await writeAuditLog({
        request,
        userId,
        action: "TRANSFER_FAILURE",
        success: false,
        metadata: {
          reason: "currency_mismatch",
          amount,
          recipientLast4:
            receiverWallet.accountNumber.slice(-4),
        },
      });

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

    try {
      const transaction =
        await prisma.$transaction(
          async (tx) => {
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

            if (
              senderDebit.count !== 1
            ) {
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

      await writeAuditLog({
        request,
        userId,
        action: "TRANSFER_SUCCESS",
        entityType: "TRANSACTION",
        entityId: transaction.id,

        metadata: {
          reference:
            transaction.reference,

          amount:
            transaction.amount.toString(),

          recipientLast4:
            receiverWallet.accountNumber.slice(-4),
        },
      });

      return NextResponse.json({
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
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "INSUFFICIENT_BALANCE"
      ) {
        await writeAuditLog({
          request,
          userId,
          action: "TRANSFER_FAILURE",
          success: false,

          metadata: {
            reason:
              "insufficient_balance",
            amount,
            recipientLast4:
              receiverWallet.accountNumber.slice(-4),
          },
        });

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
       * Two identical requests can arrive
       * almost simultaneously.
       *
       * The unique idempotency constraint
       * guarantees only one transaction wins.
       */
      if (
        isUniqueConstraintError(error)
      ) {
        const existing =
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

        if (
          existing &&
          existing.senderWalletId ===
            sender.wallet.id &&
          existing.type === "TRANSFER"
        ) {
          await writeAuditLog({
            request,
            userId,
            action:
              "TRANSFER_DUPLICATE",
            entityType:
              "TRANSACTION",
            entityId: existing.id,

            metadata: {
              reference:
                existing.reference,
            },
          });

          return NextResponse.json({
            success: true,
            duplicate: true,
            message:
              "Transfer was already processed.",

            transaction: {
              reference:
                existing.reference,

              amount:
                existing.amount.toString(),

              recipient:
                existing.receiverWallet
                  ? `${existing.receiverWallet.user.firstName} ${existing.receiverWallet.user.lastName}`
                  : "Recipient",
            },
          });
        }
      }

      await writeAuditLog({
        request,
        userId,
        action: "TRANSFER_FAILURE",
        success: false,

        metadata: {
          reason: "processing_error",
          amount,
          recipientLast4:
            receiverWallet.accountNumber.slice(-4),
        },
      });

      console.error(
        "Transfer processing error:",
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
  } catch (error) {
    console.error(
      "Transfer route error:",
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
