import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { getAuthenticatedUserId } from "@/lib/auth/require-session";
import { getNigeriaDayBounds } from "@/lib/day-boundaries";
import { transferSchema } from "@/lib/validation/transfer";

import {
  DAILY_TRANSFER_COUNT_LIMIT,
  DAILY_TRANSFER_LIMIT,
} from "@/lib/transfer-limits";

function isUniqueConstraintError(
  error: unknown
) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function POST(
  request: Request
) {
  try {
    const userId =
      await getAuthenticatedUserId();

    if (!userId) {
      await writeAuditLog({
        request,
        action: "TRANSFER_FAILURE",
        success: false,

        metadata: {
          reason:
            "not_authenticated",
        },
      });

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
          message:
            "Invalid request.",
        },
        { status: 400 }
      );
    }

    const result =
      transferSchema.safeParse(
        body
      );

    if (!result.success) {
      await writeAuditLog({
        request,
        userId,
        action: "TRANSFER_FAILURE",
        success: false,

        metadata: {
          reason:
            "validation_failed",
        },
      });

      return NextResponse.json(
        {
          success: false,
          message:
            "Validation failed.",
          errors:
            result.error.flatten(),
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
          reason:
            "sender_wallet_missing",
          amount,
        },
      });

      return NextResponse.json(
        {
          success: false,
          message:
            "Sender wallet not found.",
        },
        { status: 404 }
      );
    }

    /*
     * Idempotency comes before new limit
     * checks.
     *
     * A legitimate retry of a transfer that
     * already succeeded should return its
     * original result rather than being
     * rejected because the daily limit has
     * since been reached.
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
        existingTransaction.type !==
          "TRANSFER"
      ) {
        await writeAuditLog({
          request,
          userId,
          action: "TRANSFER_FAILURE",
          success: false,

          metadata: {
            reason:
              "idempotency_conflict",
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
        action:
          "TRANSFER_DUPLICATE",

        entityType:
          "TRANSACTION",

        entityId:
          existingTransaction.id,

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
          reason:
            "recipient_not_found",

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
      receiverWallet.id ===
      sender.wallet.id
    ) {
      await writeAuditLog({
        request,
        userId,
        action: "TRANSFER_FAILURE",
        success: false,

        metadata: {
          reason:
            "self_transfer",
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
          reason:
            "currency_mismatch",

          amount,

          recipientLast4:
            receiverWallet.accountNumber.slice(
              -4
            ),
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

    const { start, end } =
      getNigeriaDayBounds();

    /*
     * Read today's successful outgoing
     * transfers.
     */
    const [
      dailyAmountResult,
      dailyTransferCount,
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          senderWalletId:
            sender.wallet.id,

          type: "TRANSFER",
          status: "SUCCESSFUL",

          createdAt: {
            gte: start,
            lt: end,
          },
        },

        _sum: {
          amount: true,
        },
      }),

      prisma.transaction.count({
        where: {
          senderWalletId:
            sender.wallet.id,

          type: "TRANSFER",
          status: "SUCCESSFUL",

          createdAt: {
            gte: start,
            lt: end,
          },
        },
      }),
    ]);

    const amountUsedToday =
      Number(
        dailyAmountResult._sum
          .amount ?? 0
      );

    const projectedDailyTotal =
      amountUsedToday + amount;

    if (
      projectedDailyTotal >
      DAILY_TRANSFER_LIMIT
    ) {
      await writeAuditLog({
        request,
        userId,
        action: "TRANSFER_FAILURE",
        success: false,

        metadata: {
          reason:
            "daily_amount_limit_exceeded",

          amount,

          usedToday:
            amountUsedToday,

          dailyLimit:
            DAILY_TRANSFER_LIMIT,
        },
      });

      return NextResponse.json(
        {
          success: false,

          message:
            "This transfer would exceed your daily transfer limit.",

          limit: {
            daily:
              DAILY_TRANSFER_LIMIT,

            used:
              amountUsedToday,

            remaining:
              Math.max(
                0,
                DAILY_TRANSFER_LIMIT -
                  amountUsedToday
              ),
          },
        },
        { status: 400 }
      );
    }

    if (
      dailyTransferCount >=
      DAILY_TRANSFER_COUNT_LIMIT
    ) {
      await writeAuditLog({
        request,
        userId,
        action: "TRANSFER_FAILURE",
        success: false,

        metadata: {
          reason:
            "daily_count_limit_exceeded",

          count:
            dailyTransferCount,

          countLimit:
            DAILY_TRANSFER_COUNT_LIMIT,
        },
      });

      return NextResponse.json(
        {
          success: false,

          message:
            "You have reached your daily transfer count limit.",
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
            /*
             * Re-check daily controls inside
             * the financial transaction.
             */
            const [
              lockedDailyAmount,
              lockedDailyCount,
            ] = await Promise.all([
              tx.transaction.aggregate({
                where: {
                  senderWalletId:
                    sender.wallet!.id,

                  type: "TRANSFER",
                  status:
                    "SUCCESSFUL",

                  createdAt: {
                    gte: start,
                    lt: end,
                  },
                },

                _sum: {
                  amount: true,
                },
              }),

              tx.transaction.count({
                where: {
                  senderWalletId:
                    sender.wallet!.id,

                  type: "TRANSFER",
                  status:
                    "SUCCESSFUL",

                  createdAt: {
                    gte: start,
                    lt: end,
                  },
                },
              }),
            ]);

            const currentDailyAmount =
              Number(
                lockedDailyAmount
                  ._sum.amount ?? 0
              );

            if (
              currentDailyAmount +
                amount >
              DAILY_TRANSFER_LIMIT
            ) {
              throw new Error(
                "DAILY_AMOUNT_LIMIT"
              );
            }

            if (
              lockedDailyCount >=
              DAILY_TRANSFER_COUNT_LIMIT
            ) {
              throw new Error(
                "DAILY_COUNT_LIMIT"
              );
            }

            const senderDebit =
              await tx.wallet.updateMany({
                where: {
                  id:
                    sender.wallet!.id,

                  balance: {
                    gte: amount,
                  },
                },

                data: {
                  balance: {
                    decrement:
                      amount,
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
                id:
                  receiverWallet.id,
              },

              data: {
                balance: {
                  increment:
                    amount,
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
                status:
                  "SUCCESSFUL",

                senderWalletId:
                  sender.wallet!.id,

                receiverWalletId:
                  receiverWallet.id,
              },
            });
          },
          {
            isolationLevel:
              "Serializable",
          }
        );

      await writeAuditLog({
        request,
        userId,
        action:
          "TRANSFER_SUCCESS",

        entityType:
          "TRANSACTION",

        entityId:
          transaction.id,

        metadata: {
          reference:
            transaction.reference,

          amount:
            transaction.amount.toString(),

          recipientLast4:
            receiverWallet.accountNumber.slice(
              -4
            ),
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
          action:
            "TRANSFER_FAILURE",
          success: false,

          metadata: {
            reason:
              "insufficient_balance",

            amount,

            recipientLast4:
              receiverWallet.accountNumber.slice(
                -4
              ),
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

      if (
        error instanceof Error &&
        error.message ===
          "DAILY_AMOUNT_LIMIT"
      ) {
        await writeAuditLog({
          request,
          userId,
          action:
            "TRANSFER_FAILURE",
          success: false,

          metadata: {
            reason:
              "daily_amount_limit_exceeded",
            amount,
          },
        });

        return NextResponse.json(
          {
            success: false,
            message:
              "This transfer would exceed your daily transfer limit.",
          },
          { status: 400 }
        );
      }

      if (
        error instanceof Error &&
        error.message ===
          "DAILY_COUNT_LIMIT"
      ) {
        await writeAuditLog({
          request,
          userId,
          action:
            "TRANSFER_FAILURE",
          success: false,

          metadata: {
            reason:
              "daily_count_limit_exceeded",
          },
        });

        return NextResponse.json(
          {
            success: false,
            message:
              "You have reached your daily transfer count limit.",
          },
          { status: 400 }
        );
      }

      if (
        isUniqueConstraintError(
          error
        )
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
          existing.type ===
            "TRANSFER"
        ) {
          await writeAuditLog({
            request,
            userId,
            action:
              "TRANSFER_DUPLICATE",

            entityType:
              "TRANSACTION",

            entityId:
              existing.id,

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
        action:
          "TRANSFER_FAILURE",
        success: false,

        metadata: {
          reason:
            "processing_error",
          amount,
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
