import "dotenv/config";

import pg from "pg";

const { Client } = pg;

const connectionString =
  process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error(
    "DIRECT_URL is missing."
  );
}

const client = new Client({
  connectionString,
});

async function main() {
  await client.connect();

  console.log(
    "\n1. UNBALANCED POSTINGS"
  );

  const unbalanced =
    await client.query(`
      SELECT
        p."reference",

        SUM(
          CASE
            WHEN l."side" = 'DEBIT'
            THEN l."amount"
            ELSE 0
          END
        ) AS "debits",

        SUM(
          CASE
            WHEN l."side" = 'CREDIT'
            THEN l."amount"
            ELSE 0
          END
        ) AS "credits"

      FROM public."AccountingPosting" p

      JOIN public."AccountingLine" l
        ON l."postingId" = p."id"

      WHERE p."postedAt" IS NOT NULL

      GROUP BY
        p."id",
        p."reference"

      HAVING
        SUM(
          CASE
            WHEN l."side" = 'DEBIT'
            THEN l."amount"
            ELSE 0
          END
        )
        <>
        SUM(
          CASE
            WHEN l."side" = 'CREDIT'
            THEN l."amount"
            ELSE 0
          END
        );
    `);

  console.table(
    unbalanced.rows
  );

  console.log(
    "\n2. UNFINISHED POSTINGS"
  );

  const unfinished =
    await client.query(`
      SELECT
        "reference",
        "createdAt"
      FROM public."AccountingPosting"
      WHERE "postedAt" IS NULL;
    `);

  console.table(
    unfinished.rows
  );

  console.log(
    "\n3. WALLET VS ACCOUNTING"
  );

  const reconciliation =
    await client.query(`
      SELECT
        w."accountNumber",

        w."balance"
          AS "walletBalance",

        COALESCE(
          SUM(
            CASE
              WHEN p."postedAt"
                IS NULL
                THEN 0

              WHEN l."side" =
                'CREDIT'
                THEN l."amount"

              WHEN l."side" =
                'DEBIT'
                THEN -l."amount"

              ELSE 0
            END
          ),
          0
        ) AS "accountingBalance",

        w."balance" -
        COALESCE(
          SUM(
            CASE
              WHEN p."postedAt"
                IS NULL
                THEN 0

              WHEN l."side" =
                'CREDIT'
                THEN l."amount"

              WHEN l."side" =
                'DEBIT'
                THEN -l."amount"

              ELSE 0
            END
          ),
          0
        ) AS "difference"

      FROM public."Wallet" w

      JOIN public."AccountingAccount" a
        ON a."walletId" =
           w."id"

      LEFT JOIN public."AccountingLine" l
        ON l."accountId" =
           a."id"

      LEFT JOIN public."AccountingPosting" p
        ON p."id" =
           l."postingId"

      GROUP BY
        w."id",
        w."accountNumber",
        w."balance"

      ORDER BY
        w."accountNumber";
    `);

  console.table(
    reconciliation.rows
  );

  const badWallets =
    reconciliation.rows.filter(
      (row) =>
        Number(row.difference) !==
        0
    );

  console.log(
    "\n4. SUMMARY"
  );

  console.log(
    "Unbalanced postings:",
    unbalanced.rowCount
  );

  console.log(
    "Unfinished postings:",
    unfinished.rowCount
  );

  console.log(
    "Wallet discrepancies:",
    badWallets.length
  );

  if (
    unbalanced.rowCount !== 0 ||
    unfinished.rowCount !== 0 ||
    badWallets.length !== 0
  ) {
    throw new Error(
      "Day 43 accounting verification failed."
    );
  }

  console.log("");
  console.log(
    "✅ Day 43 opening accounting is balanced and reconciled."
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end().catch(
      () => {}
    );
  });
