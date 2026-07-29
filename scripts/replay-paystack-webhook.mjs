import "dotenv/config";

import {
  createHmac,
} from "crypto";

import pg from "pg";

const { Client } = pg;

const secret =
  process.env.PAYSTACK_SECRET_KEY;

if (
  !secret ||
  !secret.startsWith("sk_test_")
) {
  throw new Error(
    "This replay test requires a Paystack TEST secret key."
  );
}

const client = new Client({
  connectionString:
    process.env.DIRECT_URL,
});

try {
  await client.connect();

  let reference =
    process.argv[2];

  /*
   * If no reference is supplied,
   * automatically use the most recent
   * successful Paystack funding attempt.
   */
  if (!reference) {
    const result =
      await client.query(`
        SELECT "reference"
        FROM public."FundingAttempt"
        WHERE "provider" = 'PAYSTACK'
          AND "status" = 'SUCCESSFUL'
        ORDER BY
          "paidAt" DESC NULLS LAST,
          "createdAt" DESC
        LIMIT 1;
      `);

    reference =
      result.rows[0]?.reference;
  }

  if (!reference) {
    throw new Error(
      "No successful Paystack funding reference was found."
    );
  }

  console.log(
    "Replaying reference:",
    reference
  );

  /*
   * The webhook handler only requires
   * the event type and Paystack reference.
   *
   * The handler itself performs
   * server-to-server Paystack verification.
   */
  const rawBody =
    JSON.stringify({
      event:
        "charge.success",

      data: {
        reference,
      },
    });

  const signature =
    createHmac(
      "sha512",
      secret
    )
      .update(rawBody)
      .digest("hex");

  const webhookUrl =
    process.env.LOCAL_WEBHOOK_URL ??
    "http://127.0.0.1:3000/api/webhooks/paystack";

  console.log(
    "Webhook:",
    webhookUrl
  );

  const response =
    await fetch(
      webhookUrl,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "x-paystack-signature":
            signature,
        },

        body:
          rawBody,
      }
    );

  const responseText =
    await response.text();

  console.log(
    "HTTP:",
    response.status
  );

  console.log(
    "Response:",
    responseText
  );

  if (!response.ok) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error("");
  console.error(
    "❌ Webhook replay failed:"
  );

  console.error(error);

  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
