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

    if (!sender.wallet.transfersEnabled) {
      await writeAuditLog({
        request,
        userId,
        action: "TRANSFER_FAILURE",
        success: false,
        entityType: "WALLET",
        entityId: sender.wallet.id,
        metadata: {
          reason: "transfers_disabled",
        },
      });

      return NextResponse.json(
        {
          success: false,
          message:
            "Outgoing transfers are currently disabled for this wallet.",
        },
        { status: 403 }
      );
    }

    const personalDailyLimit =
      sender.wallet
        .personalDailyTransferLimit !==
      null
        ? Number(
            sender.wallet
              .personalDailyTransferLimit
          )
        : null;

    const effectiveDailyLimit =
      personalDailyLimit === null
        ? DAILY_TRANSFER_LIMIT
        : Math.min(
            personalDailyLimit,
            DAILY_TRANSFER_LIMIT
          );

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
      effectiveDailyLimit
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
            effectiveDailyLimit,
        },
      });

      return NextResponse.json(
        {
          success: false,

          message:
            "This transfer would exceed your daily transfer limit.",

          limit: {
            daily:
              effectiveDailyLimit,

            used:
              amountUsedToday,

            remaining:
              Math.max(
                0,
                effectiveDailyLimit -
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
             * Read both wallets inside the
             * serializable financial transaction.
             */
            const currentWallet =
              await tx.wallet.findUnique({
                where: {
                  id:
                    sender.wallet!.id,
                },

                select: {
                  id: true,
                  balance: true,
                  currency: true,

                  personalDailyTransferLimit:
                    true,

                  transfersEnabled:
                    true,
                },
              });

            if (!currentWallet) {
              throw new Error(
                "SENDER_WALLET_MISSING"
              );
            }

            if (
              !currentWallet.transfersEnabled
            ) {
              throw new Error(
                "TRANSFERS_DISABLED"
              );
            }

            const currentReceiverWallet =
              await tx.wallet.findUnique({
                where: {
                  id:
                    receiverWallet.id,
                },

                select: {
                  id: true,
                  balance: true,
                  currency: true,
                },
              });

            if (!currentReceiverWallet) {
              throw new Error(
                "RECIPIENT_NOT_FOUND"
              );
            }

            if (
              currentWallet.currency !==
              currentReceiverWallet.currency
            ) {
              throw new Error(
                "CURRENCY_MISMATCH"
              );
            }

            /*
             * Re-check the user's effective
             * daily transfer limit.
             */
            const currentPersonalLimit =
              currentWallet
                .personalDailyTransferLimit !==
              null
                ? Number(
                    currentWallet
                      .personalDailyTransferLimit
                  )
                : null;

            const transactionDailyLimit =
              currentPersonalLimit ===
              null
                ? DAILY_TRANSFER_LIMIT
                : Math.min(
                    currentPersonalLimit,
                    DAILY_TRANSFER_LIMIT
                  );

            const [
              lockedDailyAmount,
              lockedDailyCount,
            ] = await Promise.all([
              tx.transaction.aggregate({
                where: {
                  senderWalletId:
                    currentWallet.id,

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
                    currentWallet.id,

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
              transactionDailyLimit
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

            /*
             * Debit sender only when the
             * wallet still has enough money.
             */
            const senderDebit =
              await tx.wallet.updateMany({
                where: {
                  id:
                    currentWallet.id,

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

            /*
             * Read sender's resulting balance.
             */
            const updatedSenderWallet =
              await tx.wallet.findUnique({
                where: {
                  id:
                    currentWallet.id,
                },

                select: {
                  balance: true,
                  currency: true,
                },
              });

            if (!updatedSenderWallet) {
              throw new Error(
                "SENDER_WALLET_MISSING"
              );
            }

            /*
             * Credit recipient and obtain
             * their resulting balance.
             */
            const updatedReceiverWallet =
              await tx.wallet.update({
                where: {
                  id:
                    currentReceiverWallet.id,
                },

                data: {
                  balance: {
                    increment:
                      amount,
                  },
                },

                select: {
                  balance: true,
                  currency: true,
                },
              });

            /*
             * Create the transfer record.
             */
            const createdTransaction =
              await tx.transaction.create({
                data: {
                  reference,
                  idempotencyKey,
                  amount,
                  narration,

                  type: "TRANSFER",

                  status:
                    "SUCCESSFUL",

                  senderWalletId:
                    currentWallet.id,

                  receiverWalletId:
                    currentReceiverWallet.id,
                },
              });

            /*
             * Every transfer now creates
             * two immutable ledger entries.
             */
            await tx.ledgerEntry.createMany({
              data: [
                {
                  entryReference:
                    `LEDGER-${reference}-DEBIT`,

                  walletId:
                    currentWallet.id,

                  transactionId:
                    createdTransaction.id,

                  direction:
                    "DEBIT",

                  source:
                    "TRANSFER",

                  amount:
                    createdTransaction.amount,

                  balanceBefore:
                    currentWallet.balance,

                  balanceAfter:
                    updatedSenderWallet.balance,

                  currency:
                    updatedSenderWallet.currency,

                  description:
                    narration ||
                    "Wallet transfer",
                },

                {
                  entryReference:
                    `LEDGER-${reference}-CREDIT`,

                  walletId:
                    currentReceiverWallet.id,

                  transactionId:
                    createdTransaction.id,

                  direction:
                    "CREDIT",

                  source:
                    "TRANSFER",

                  amount:
                    createdTransaction.amount,

                  balanceBefore:
                    currentReceiverWallet.balance,

                  balanceAfter:
                    updatedReceiverWallet.balance,

                  currency:
                    updatedReceiverWallet.currency,

                  description:
                    narration ||
                    "Wallet transfer",
                },
              ],
            });

            /*
             * DOUBLE-ENTRY ACCOUNTING
             *
             * Sender wallet liability    DEBIT
             * Receiver wallet liability  CREDIT
             */
            const senderAccountingAccount =
              await tx.accountingAccount.upsert({
                where: {
                  walletId:
                    currentWallet.id,
                },

                update: {},

                create: {
                  code:
                    `WALLET-${currentWallet.id}`,

                  name:
                    "Customer Wallet Liability",

                  type:
                    "LIABILITY",

                  walletId:
                    currentWallet.id,

                  isSystem:
                    false,
                },
              });

            const receiverAccountingAccount =
              await tx.accountingAccount.upsert({
                where: {
                  walletId:
                    currentReceiverWallet.id,
                },

                update: {},

                create: {
                  code:
                    `WALLET-${currentReceiverWallet.id}`,

                  name:
                    "Customer Wallet Liability",

                  type:
                    "LIABILITY",

                  walletId:
                    currentReceiverWallet.id,

                  isSystem:
                    false,
                },
              });

            const accountingPosting =
              await tx.accountingPosting.create({
                data: {
                  reference:
                    `POSTING-${reference}`,

                  transactionId:
                    createdTransaction.id,

                  description:
                    narration ||
                    "Wallet transfer",
                },
              });

            await tx.accountingLine.createMany({
              data: [
                {
                  postingId:
                    accountingPosting.id,

                  accountId:
                    senderAccountingAccount.id,

                  side:
                    "DEBIT",

                  amount:
                    createdTransaction.amount,

                  currency:
                    currentWallet.currency,
                },

                {
                  postingId:
                    accountingPosting.id,

                  accountId:
                    receiverAccountingAccount.id,

                  side:
                    "CREDIT",

                  amount:
                    createdTransaction.amount,

                  currency:
                    currentReceiverWallet.currency,
                },
              ],
            });

            /*
             * Finalisation triggers the
             * database balancing check.
             */
            await tx.accountingPosting.update({
              where: {
                id:
                  accountingPosting.id,
              },

              data: {
                postedAt:
                  new Date(),
              },
            });

            return createdTransaction;
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
