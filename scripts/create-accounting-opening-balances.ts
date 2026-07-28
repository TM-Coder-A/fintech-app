import "dotenv/config";

import { prisma } from "../lib/prisma";

async function main() {
  console.log(
    "Starting Day 43 accounting cutover..."
  );

  /*
   * System asset account used to balance
   * customer wallet liabilities that
   * already existed before Day 43.
   */
  const openingAccount =
    await prisma.accountingAccount.upsert({
      where: {
        code:
          "OPENING_SETTLEMENT_ASSET",
      },

      update: {},

      create: {
        code:
          "OPENING_SETTLEMENT_ASSET",

        name:
          "Opening Settlement Asset",

        type: "ASSET",

        isSystem: true,
      },
    });

  /*
   * Used by our development funding flow.
   * Paystack accounting will later use
   * separate production settlement accounts.
   */
  await prisma.accountingAccount.upsert({
    where: {
      code:
        "DEV_FUNDING_CLEARING",
    },

    update: {},

    create: {
      code:
        "DEV_FUNDING_CLEARING",

      name:
        "Development Funding Clearing",

      type: "ASSET",

      isSystem: true,
    },
  });

  const wallets =
    await prisma.wallet.findMany({
      select: {
        id: true,
        accountNumber: true,
        balance: true,
        currency: true,
        createdAt: true,
      },

      orderBy: {
        createdAt: "asc",
      },
    });

  console.log(
    `Found ${wallets.length} wallet(s).`
  );

  for (const wallet of wallets) {
    /*
     * Every customer wallet is represented
     * as a liability account in the books.
     */
    const walletAccount =
      await prisma.accountingAccount.upsert({
        where: {
          walletId: wallet.id,
        },

        update: {},

        create: {
          code:
            `WALLET-${wallet.id}`,

          name:
            `Customer Wallet ${wallet.accountNumber}`,

          type:
            "LIABILITY",

          walletId:
            wallet.id,

          isSystem:
            false,
        },
      });

    const balance =
      Number(wallet.balance);

    /*
     * Zero-balance wallets need an account,
     * but no opening accounting posting.
     */
    if (balance === 0) {
      console.log(
        `${wallet.accountNumber}: account created, zero opening balance.`
      );

      continue;
    }

    const reference =
      `ACCOUNTING-OPENING-${wallet.id}`;

    /*
     * Makes this cutover script safe to
     * execute more than once.
     */
    const existing =
      await prisma.accountingPosting.findUnique({
        where: {
          reference,
        },

        select: {
          id: true,
          postedAt: true,
        },
      });

    if (existing) {
      console.log(
        `${wallet.accountNumber}: opening posting already exists.`
      );

      continue;
    }

    await prisma.$transaction(
      async (tx) => {
        /*
         * Start as an unposted draft.
         */
        const posting =
          await tx.accountingPosting.create({
            data: {
              reference,

              description:
                "Day 43 accounting cutover opening balance",
            },
          });

        /*
         * Existing customer balance:
         *
         * Opening settlement asset  DEBIT
         * Customer liability        CREDIT
         */
        await tx.accountingLine.createMany({
          data: [
            {
              postingId:
                posting.id,

              accountId:
                openingAccount.id,

              side: "DEBIT",

              amount:
                wallet.balance,

              currency:
                wallet.currency,
            },

            {
              postingId:
                posting.id,

              accountId:
                walletAccount.id,

              side: "CREDIT",

              amount:
                wallet.balance,

              currency:
                wallet.currency,
            },
          ],
        });

        /*
         * Setting postedAt causes our
         * PostgreSQL trigger to verify:
         *
         * total debits = total credits.
         */
        await tx.accountingPosting.update({
          where: {
            id: posting.id,
          },

          data: {
            postedAt:
              new Date(),
          },
        });
      },
      {
        isolationLevel:
          "Serializable",
      }
    );

    console.log(
      `${wallet.accountNumber}: opening accounting posting created.`
    );
  }

  console.log("");
  console.log(
    "Day 43 accounting cutover completed."
  );
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "Accounting cutover failed:"
    );

    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
