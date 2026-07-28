import "dotenv/config";

import {
  randomUUID,
} from "crypto";

import pg from "pg";

const { Client } = pg;

const accountNumber =
  process.argv[2];

const confirmed =
  process.argv.includes(
    "--confirm"
  );

if (!accountNumber) {
  console.error(
    "Usage: node scripts/repair-wallet-cache.mjs ACCOUNT_NUMBER --confirm"
  );

  process.exit(1);
}

if (!confirmed) {
  console.error(
    "Repair refused. Add --confirm after reviewing the discrepancy."
  );

  process.exit(1);
}

const client = new Client({
  connectionString:
    process.env.DIRECT_URL,
});

async function main() {
  await client.connect();

  await client.query("BEGIN");

  try {
    const result =
      await client.query(
        `
          WITH ledger AS (
            SELECT
              "walletId",

              COALESCE(
                SUM(
                  CASE
                    WHEN "direction" =
                      'CREDIT'
                      THEN "amount"

                    ELSE -"amount"
                  END
                ),
                0
              ) AS balance

            FROM public."LedgerEntry"

            GROUP BY "walletId"
          ),

          accounting AS (
            SELECT
              a."walletId",

              COALESCE(
                SUM(
                  CASE
                    WHEN p."postedAt"
                      IS NULL
                      THEN 0

                    WHEN l."side" =
                      'CREDIT'
                      THEN l."amount"

                    ELSE -l."amount"
                  END
                ),
                0
              ) AS balance

            FROM public."AccountingAccount" a

            LEFT JOIN public."AccountingLine" l
              ON l."accountId" =
                 a."id"

            LEFT JOIN public."AccountingPosting" p
              ON p."id" =
                 l."postingId"

            WHERE
              a."walletId"
              IS NOT NULL

            GROUP BY
              a."walletId"
          )

          SELECT
            w."id",

            w."balance"
              AS "walletBalance",

            COALESCE(
              le.balance,
              0
            ) AS "ledgerBalance",

            COALESCE(
              ac.balance,
              0
            ) AS "accountingBalance"

          FROM public."Wallet" w

          LEFT JOIN ledger le
            ON le."walletId" =
               w."id"

          LEFT JOIN accounting ac
            ON ac."walletId" =
               w."id"

          WHERE
            w."accountNumber" =
              $1

          FOR UPDATE OF w;
        `,
        [accountNumber]
      );

    if (!result.rows.length) {
      throw new Error(
        "Wallet not found."
      );
    }

    const row =
      result.rows[0];

    const walletBalance =
      Number(
        row.walletBalance
      );

    const ledgerBalance =
      Number(
        row.ledgerBalance
      );

    const accountingBalance =
      Number(
        row.accountingBalance
      );

    if (
      ledgerBalance !==
      accountingBalance
    ) {
      throw new Error(
        "Repair refused: ledger and accounting do not agree."
      );
    }

    if (
      walletBalance ===
      ledgerBalance
    ) {
      console.log(
        "Wallet already reconciles. No repair required."
      );

      await client.query(
        "ROLLBACK"
      );

      return;
    }

    await client.query(
      `
        UPDATE public."Wallet"
        SET "balance" = $2
        WHERE "id" = $1;
      `,
      [
        row.id,
        row.ledgerBalance,
      ]
    );

    await client.query(
      `
        INSERT INTO public."AuditLog" (
          "id",
          "userId",
          "action",
          "success",
          "entityType",
          "entityId",
          "metadata",
          "createdAt"
        )
        VALUES (
          $1,
          NULL,
          'RECONCILIATION_WALLET_CACHE_REPAIR',
          TRUE,
          'WALLET',
          $2,
          $3::JSONB,
          CURRENT_TIMESTAMP
        );
      `,
      [
        randomUUID(),

        row.id,

        JSON.stringify({
          previousBalance:
            String(
              row.walletBalance
            ),

          correctedBalance:
            String(
              row.ledgerBalance
            ),
        }),
      ]
    );

    await client.query(
      "COMMIT"
    );

    console.log(
      "✅ Wallet cache repaired."
    );

    console.log(
      "Run npm run reconcile immediately."
    );
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
