import "dotenv/config";
import pg from "pg";

const {
  Client,
} = pg;

const client =
  new Client({
    connectionString:
      process.env.DIRECT_URL,
  });

await client.connect();

try {
  const result =
    await client.query(`
      SELECT
        fa."reference",
        fa."amount",
        fa."status",
        fa."channel",
        fa."providerTransactionId",

        COUNT(
          DISTINCT t."id"
        ) AS "transactions",

        COUNT(
          DISTINCT le."id"
        ) AS "ledgerEntries",

        COUNT(
          DISTINCT ap."id"
        ) AS "accountingPostings",

        COUNT(
          DISTINCT al."id"
        ) AS "accountingLines"

      FROM public."FundingAttempt" fa

      LEFT JOIN public."Transaction" t
        ON t."reference" =
           fa."reference"

      LEFT JOIN public."LedgerEntry" le
        ON le."transactionId" =
           t."id"

      LEFT JOIN public."AccountingPosting" ap
        ON ap."transactionId" =
           t."id"

      LEFT JOIN public."AccountingLine" al
        ON al."postingId" =
           ap."id"

      WHERE
        fa."provider" =
          'PAYSTACK'

      GROUP BY
        fa."id",
        fa."reference",
        fa."amount",
        fa."status",
        fa."channel",
        fa."providerTransactionId"

      ORDER BY
        fa."createdAt" DESC

      LIMIT 10;
    `);

  console.table(
    result.rows
  );
} finally {
  await client.end();
}
