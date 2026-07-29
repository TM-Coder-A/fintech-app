import {
  expectedPaystackDomain,
} from "@/lib/paystack-webhook";

import {
  verifyPaystackTransaction,
} from "@/lib/paystack";

import { prisma } from "@/lib/prisma";

type LockedFundingAttempt = {
  id: string;
  userId: string;
  walletId: string;
  idempotencyKey: string;
  reference: string;
  amount: string;
  currency: string;
  status: string;
  providerTransactionId:
    string | null;
};

export class PermanentPaymentError
  extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      "PermanentPaymentError";
  }
}

export class UnknownFundingAttemptError
  extends Error {
  constructor() {
    super(
      "Funding attempt was not found."
    );

    this.name =
      "UnknownFundingAttemptError";
  }
}

function getProviderTransactionId(
  value: number | string
): string | null {
  if (typeof value === "string") {
    return value;
  }

  /*
   * Paystack transaction IDs may be
   * larger than ordinary integer types.
   * Never preserve an unsafe JS Number.
   */
  if (
    Number.isSafeInteger(value)
  ) {
    return String(value);
  }

  return null;
}

function isRetryablePrismaError(
  error: unknown
) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as {
      code?: string;
    }).code === "P2034"
  );
}

async function executeCredit(
  reference: string
) {
  /*
   * Paystack verification is intentionally
   * server-to-server.
   */
  const payment =
    await verifyPaystackTransaction(
      reference
    );

  if (
    payment.status !== "success"
  ) {
    throw new PermanentPaymentError(
      `Paystack status is ${payment.status}.`
    );
  }

  if (
    payment.reference !== reference
  ) {
    throw new PermanentPaymentError(
      "Paystack reference mismatch."
    );
  }

  if (
    payment.currency !== "NGN"
  ) {
    throw new PermanentPaymentError(
      "Unexpected Paystack currency."
    );
  }

  if (
    payment.domain !==
    expectedPaystackDomain()
  ) {
    throw new PermanentPaymentError(
      "Paystack environment mismatch."
    );
  }

  const providerTransactionId =
    getProviderTransactionId(
      payment.id
    );

  return prisma.$transaction(
    async (tx) => {
      /*
       * Lock the FundingAttempt.
       *
       * Concurrent duplicate webhooks for
       * the same reference must wait here.
       */
      const rows =
        await tx.$queryRaw<
          LockedFundingAttempt[]
        >`
          SELECT
            "id",
            "userId",
            "walletId",
            "idempotencyKey",
            "reference",
            "amount"::TEXT AS "amount",
            "currency",
            "status",
            "providerTransactionId"
          FROM public."FundingAttempt"
          WHERE "reference" = ${reference}
          FOR UPDATE
        `;

      const attempt =
        rows[0];

      if (!attempt) {
        throw new UnknownFundingAttemptError();
      }

      /*
       * Exactly-once protection.
       */
      if (
        attempt.status ===
        "SUCCESSFUL"
      ) {
        return {
          duplicate: true,
          credited: false,
          attemptId:
            attempt.id,
          userId:
            attempt.userId,
          reference:
            attempt.reference,
        };
      }

      if (
        attempt.status !==
          "PENDING" &&
        attempt.status !==
          "PROCESSING"
      ) {
        throw new PermanentPaymentError(
          `Funding attempt cannot be credited from status ${attempt.status}.`
        );
      }

      const expectedKobo =
        Math.round(
          Number(
            attempt.amount
          ) * 100
        );

      if (
        payment.amount !==
        expectedKobo
      ) {
        throw new PermanentPaymentError(
          "Paystack amount mismatch."
        );
      }

      if (
        payment.currency !==
        attempt.currency
      ) {
        throw new PermanentPaymentError(
          "Funding currency mismatch."
        );
      }

      /*
       * Protect against the same provider
       * transaction being linked to another
       * funding attempt.
       */
      if (providerTransactionId) {
        const reusedProviderId =
          await tx.fundingAttempt.findFirst({
            where: {
              providerTransactionId,

              NOT: {
                id: attempt.id,
              },
            },

            select: {
              id: true,
            },
          });

        if (reusedProviderId) {
          throw new PermanentPaymentError(
            "Paystack transaction has already been assigned elsewhere."
          );
        }
      }

      await tx.fundingAttempt.update({
        where: {
          id: attempt.id,
        },

        data: {
          status:
            "PROCESSING",
        },
      });

      const currentWallet =
        await tx.wallet.findUnique({
          where: {
            id:
              attempt.walletId,
          },

          select: {
            id: true,
            balance: true,
            currency: true,
            accountNumber: true,
          },
        });

      if (!currentWallet) {
        throw new Error(
          "Funding wallet does not exist."
        );
      }

      if (
        currentWallet.currency !==
        attempt.currency
      ) {
        throw new PermanentPaymentError(
          "Wallet currency mismatch."
        );
      }

      const amountNaira =
        Number(
          attempt.amount
        );

      const updatedWallet =
        await tx.wallet.update({
          where: {
            id:
              currentWallet.id,
          },

          data: {
            balance: {
              increment:
                amountNaira,
            },
          },

          select: {
            balance: true,
            currency: true,
          },
        });

      /*
       * Financial transaction record.
       */
      const financialTransaction =
        await tx.transaction.create({
          data: {
            reference:
              attempt.reference,

            idempotencyKey:
              `PAYSTACK-${attempt.idempotencyKey}`,

            amount:
              amountNaira,

            narration:
              "Paystack wallet funding",

            type:
              "FUNDING",

            status:
              "SUCCESSFUL",

            receiverWalletId:
              currentWallet.id,
          },
        });

      /*
       * Immutable wallet ledger.
       */
      await tx.ledgerEntry.create({
        data: {
          entryReference:
            `LEDGER-${attempt.reference}-CREDIT`,

          walletId:
            currentWallet.id,

          transactionId:
            financialTransaction.id,

          direction:
            "CREDIT",

          source:
            "FUNDING",

          amount:
            amountNaira,

          balanceBefore:
            currentWallet.balance,

          balanceAfter:
            updatedWallet.balance,

          currency:
            currentWallet.currency,

          description:
            "Paystack wallet funding",
        },
      });

      /*
       * Customer wallet balance represents
       * a liability owed to the customer.
       */
      const walletAccount =
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
              `Customer Wallet ${currentWallet.accountNumber}`,

            type:
              "LIABILITY",

            walletId:
              currentWallet.id,

            isSystem:
              false,
          },
        });

      /*
       * Paystack funds awaiting settlement
       * are represented as an asset.
       */
      const paystackClearing =
        await tx.accountingAccount.upsert({
          where: {
            code:
              "PAYSTACK_CLEARING_ASSET",
          },

          update: {},

          create: {
            code:
              "PAYSTACK_CLEARING_ASSET",

            name:
              "Paystack Clearing Asset",

            type:
              "ASSET",

            isSystem:
              true,
          },
        });

      const posting =
        await tx.accountingPosting.create({
          data: {
            reference:
              `POSTING-${attempt.reference}`,

            transactionId:
              financialTransaction.id,

            description:
              "Paystack wallet funding",
          },
        });

      /*
       * Paystack clearing asset    DEBIT
       * Customer wallet liability CREDIT
       */
      await tx.accountingLine.createMany({
        data: [
          {
            postingId:
              posting.id,

            accountId:
              paystackClearing.id,

            side:
              "DEBIT",

            amount:
              amountNaira,

            currency:
              currentWallet.currency,
          },

          {
            postingId:
              posting.id,

            accountId:
              walletAccount.id,

            side:
              "CREDIT",

            amount:
              amountNaira,

            currency:
              currentWallet.currency,
          },
        ],
      });

      /*
       * PostgreSQL trigger checks that
       * debits equal credits.
       */
      await tx.accountingPosting.update({
        where: {
          id:
            posting.id,
        },

        data: {
          postedAt:
            new Date(),
        },
      });

      await tx.fundingAttempt.update({
        where: {
          id:
            attempt.id,
        },

        data: {
          status:
            "SUCCESSFUL",

          providerTransactionId,

          channel:
            payment.channel,

          paidAt:
            payment.paid_at
              ? new Date(
                  payment.paid_at
                )
              : new Date(),
        },
      });

      return {
        duplicate: false,
        credited: true,
        attemptId:
          attempt.id,
        userId:
          attempt.userId,
        reference:
          attempt.reference,
        transactionId:
          financialTransaction.id,
      };
    },
    {
      isolationLevel:
        "Serializable",
    }
  );
}

export async function creditPaystackFunding(
  reference: string
) {
  const maxAttempts = 3;

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    try {
      return await executeCredit(
        reference
      );
    } catch (error) {
      if (
        attempt < maxAttempts &&
        isRetryablePrismaError(
          error
        )
      ) {
        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              attempt * 100
            )
        );

        continue;
      }

      throw error;
    }
  }

  throw new Error(
    "Paystack credit retry exhausted."
  );
}
