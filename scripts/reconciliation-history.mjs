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
        "id",
        "status",
        "walletCount",
        "discrepancyCount",
        "ledgerErrorCount",
        "accountingErrorCount",
        "unfinishedPostingCount",
        "transactionCoverageErrors",
        "startedAt",
        "completedAt"

      FROM public."ReconciliationRun"

      ORDER BY
        "startedAt" DESC

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
