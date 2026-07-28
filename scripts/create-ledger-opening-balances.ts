import "dotenv/config";

import { prisma } from "../lib/prisma";

async function main() {
  const wallets =
    await prisma.wallet.findMany({
      select: {
        id: true,
        accountNumber: true,
        currency: true,
        balance: true,
      },

      orderBy: {
        createdAt: "asc",
      },
    });

  console.log(
    `Found ${wallets.length} wallet(s).`
  );

  for (const wallet of wallets) {
    const entryReference =
      `OPENING-${wallet.id}`;

    const existing =
      await prisma.ledgerEntry.findUnique({
        where: {
          entryReference,
        },
      });

    if (existing) {
      console.log(
        `Skipping ${wallet.accountNumber}: opening ledger already exists.`
      );

      continue;
    }

    await prisma.ledgerEntry.create({
      data: {
        entryReference,

        walletId: wallet.id,

        transactionId: null,

        direction: "CREDIT",

        source:
          "OPENING_BALANCE",

        amount: wallet.balance,

        balanceBefore: 0,

        balanceAfter:
          wallet.balance,

        currency:
          wallet.currency,

        description:
          "Day 42 ledger cutover opening balance",
      },
    });

    console.log(
      `Created opening ledger for ${wallet.accountNumber}.`
    );
  }

  console.log(
    "Ledger opening-balance cutover complete."
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
