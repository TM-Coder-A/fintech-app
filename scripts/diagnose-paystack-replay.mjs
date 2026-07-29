import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const secret = process.env.PAYSTACK_SECRET_KEY;

if (!secret) {
  console.error("❌ PAYSTACK_SECRET_KEY is missing.");
  process.exit(1);
}

console.log(
  "Paystack mode:",
  secret.startsWith("sk_test_")
    ? "TEST"
    : secret.startsWith("sk_live_")
      ? "LIVE"
      : "UNKNOWN"
);

const client = new Client({
  connectionString: process.env.DIRECT_URL,
});

try {
  await client.connect();

  const result = await client.query(`
    SELECT
      "reference",
      "status",
      "amount"::TEXT AS "amount",
      "currency",
      "providerTransactionId",
      "paidAt",
      "createdAt"
    FROM public."FundingAttempt"
    WHERE "provider" = 'PAYSTACK'
    ORDER BY "createdAt" DESC
    LIMIT 5;
  `);

  console.log("\nLatest Paystack attempts:");
  console.table(result.rows);

  const successful = result.rows.find(
    (row) => row.status === "SUCCESSFUL"
  );

  if (!successful) {
    console.error(
      "\n❌ No SUCCESSFUL Paystack FundingAttempt was found."
    );
    process.exit(1);
  }

  console.log(
    "\nTesting Paystack reference:",
    successful.reference
  );

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(
      successful.reference
    )}`,
    {
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    }
  );

  const body = await response.json();

  console.log(
    "\nPaystack HTTP status:",
    response.status
  );

  console.log(
    "Paystack API status:",
    body.status
  );

  console.log(
    "Paystack message:",
    body.message
  );

  if (body.data) {
    console.log(
      "Returned reference:",
      body.data.reference
    );

    console.log(
      "Transaction status:",
      body.data.status
    );

    console.log(
      "Domain:",
      body.data.domain
    );

    console.log(
      "Amount (kobo):",
      body.data.amount
    );
  }
} catch (error) {
  console.error("\n❌ Diagnostic failed:");
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
