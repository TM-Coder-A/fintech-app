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

  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS
    "FundingAttempt_providerTransactionId_key"
    ON public."FundingAttempt" ("providerTransactionId");
  `);

  console.log(
    "✅ Day 46 Paystack database protection installed."
  );
} catch (error) {
  console.error(
    "❌ Day 46 database setup failed:"
  );

  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
