import "dotenv/config";
import pg from "pg";

const { Client } = pg;

if (!process.env.DIRECT_URL) {
  throw new Error("DIRECT_URL is missing.");
}

const client = new Client({
  connectionString: process.env.DIRECT_URL,
});

try {
  await client.connect();

  const result = await client.query(`
    SELECT
      "reference",
      "amount"::TEXT AS "amount",
      "currency",
      "provider",
      "status",
      "providerTransactionId",
      "channel",
      "paidAt",
      "createdAt"
    FROM public."FundingAttempt"
    WHERE "provider" = 'PAYSTACK'
    ORDER BY "createdAt" DESC
    LIMIT 10;
  `);

  if (result.rows.length === 0) {
    console.log("No Paystack funding attempts found.");
  } else {
    console.table(result.rows);
  }
} catch (error) {
  console.error("Unable to read Paystack funding attempts:");
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
