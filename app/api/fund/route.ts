import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { getAuthenticatedUserId } from "@/lib/auth/require-session";
import { fundingSchema } from "@/lib/validation/funding";

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
        action: "FUNDING_FAILURE",
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
        action: "FUNDING_FAILURE",
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
      fundingSchema.safeParse(body);

    if (!result.success) {
      await writeAuditLog({
        request,
        userId,
        action: "FUNDING_FAILURE",
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
      amount,
      idempotencyKey,
    } = result.data;

    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          wallet: true,
        },
      });

    if (!user?.wallet) {
      await writeAuditLog({
        request,
        userId,
        action: "FUNDING_FAILURE",
        success: false,

        metadata: {
          reason: "wallet_not_found",
          amount,
        },
      });

      return NextResponse.json(
        {
          success: false,
          message: "Wallet not found.",
        },
        { status: 404 }
      );
    }

    const existingTransaction =
      await prisma.transaction.findUnique({
        where: {
          idempotencyKey,
        },
      });

    if (existingTransaction) {
      if (
        existingTransaction.receiverWalletId !==
          user.wallet.id ||
        existingTransaction.type !==
          "FUNDING"
      ) {
        await writeAuditLog({
          request,
          userId,
          action: "FUNDING_FAILURE",
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
              "Funding request identifier conflict.",
          },
          { status: 409 }
        );
      }

      await writeAuditLog({
        request,
        userId,
        action: "FUNDING_DUPLICATE",
        entityType: "TRANSACTION",
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
          "Funding request was already processed.",

        transaction: {
          reference:
            existingTransaction.reference,

          amount:
            existingTransaction.amount.toString(),
        },
      });
    }

    const reference =
      `FD-${randomUUID()}`;

    try {
      const transaction =
        await prisma.$transaction(
          async (tx) => {
            /*
             * Read the current wallet balance
             * inside the financial transaction.
             */
            const currentWallet =
              await tx.wallet.findUnique({
                where: {
                  id: user.wallet!.id,
                },

                select: {
                  id: true,
                  balance: true,
                  currency: true,
                },
              });

            if (!currentWallet) {
              throw new Error(
                "WALLET_NOT_FOUND"
              );
            }

            /*
             * Credit the wallet and obtain
             * the resulting balance.
             */
            const updatedWallet =
              await tx.wallet.update({
                where: {
                  id: currentWallet.id,
                },

                data: {
                  balance: {
                    increment: amount,
                  },
                },

                select: {
                  balance: true,
                  currency: true,
                },
              });

            /*
             * Create the financial
             * transaction record.
             */
            const createdTransaction =
              await tx.transaction.create({
                data: {
                  reference,
                  idempotencyKey,
                  amount,

                  narration:
                    "Development wallet funding",

                  type: "FUNDING",
                  status: "SUCCESSFUL",

                  receiverWalletId:
                    currentWallet.id,
                },
              });

            /*
             * Record the immutable ledger
             * entry in the SAME transaction.
             */
            await tx.ledgerEntry.create({
              data: {
                entryReference:
                  `LEDGER-${reference}-CREDIT`,

                walletId:
                  currentWallet.id,

                transactionId:
                  createdTransaction.id,

                direction: "CREDIT",
                source: "FUNDING",

                amount:
                  createdTransaction.amount,

                balanceBefore:
                  currentWallet.balance,

                balanceAfter:
                  updatedWallet.balance,

                currency:
                  updatedWallet.currency,

                description:
                  "Development wallet funding",
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
        action: "FUNDING_SUCCESS",
        entityType: "TRANSACTION",
        entityId: transaction.id,

        metadata: {
          reference:
            transaction.reference,

          amount:
            transaction.amount.toString(),
        },
      });

      return NextResponse.json({
        success: true,
        duplicate: false,
        message:
          "Wallet funded successfully.",

        transaction: {
          reference:
            transaction.reference,

          amount:
            transaction.amount.toString(),
        },
      });
    } catch (error) {
      if (
        isUniqueConstraintError(error)
      ) {
        const existing =
          await prisma.transaction.findUnique({
            where: {
              idempotencyKey,
            },
          });

        if (
          existing &&
          existing.receiverWalletId ===
            user.wallet.id &&
          existing.type === "FUNDING"
        ) {
          await writeAuditLog({
            request,
            userId,
            action:
              "FUNDING_DUPLICATE",
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
              "Funding request was already processed.",

            transaction: {
              reference:
                existing.reference,

              amount:
                existing.amount.toString(),
            },
          });
        }
      }

      await writeAuditLog({
        request,
        userId,
        action: "FUNDING_FAILURE",
        success: false,

        metadata: {
          reason: "processing_error",
          amount,
        },
      });

      console.error(
        "Funding processing error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to fund wallet.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(
      "Funding route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to fund wallet.",
      },
      { status: 500 }
    );
  }
}
