import "dotenv/config";

import pg from "pg";

const { Client } = pg;

const client = new Client({
  connectionString:
    process.env.DIRECT_URL,
});

async function main() {
  await client.connect();

  const result =
    await client.query(`
      SELECT
        t."reference",
        t."type",
        t."amount",

        p."reference"
          AS "postingReference",

        p."postedAt",

        COUNT(l."id")
          AS "accountingLines"

      FROM public."Transaction" t

      JOIN public."AccountingPosting" p
        ON p."transactionId" =
           t."id"

      JOIN public."AccountingLine" l
        ON l."postingId" =
           p."id"

      WHERE
        t."type" IN (
          'TRANSFER',
          'FUNDING'
        )

      GROUP BY
        t."id",
        t."reference",
        t."type",
        t."amount",
        p."reference",
        p."postedAt"

      ORDER BY
        t."createdAt" DESC

      LIMIT 20;
    `);

  console.table(
    result.rows
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
