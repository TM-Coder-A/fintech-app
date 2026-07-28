import "dotenv/config";

import pg from "pg";

const { Client } = pg;

const client = new Client({
  connectionString:
    process.env.DIRECT_URL,
});

async function main() {
  await client.connect();

  await client.query("BEGIN");

  try {
    const wallet =
      await client.query(`
        SELECT
          "id",
          "accountNumber",
          "balance"
        FROM public."Wallet"
        ORDER BY "createdAt"
        LIMIT 1;
      `);

    if (!wallet.rows.length) {
      throw new Error(
        "No wallet available for test."
      );
    }

    const selected =
      wallet.rows[0];

    /*
     * Deliberately corrupt only the
     * transactional test copy.
     */
    await client.query(
      `
        UPDATE public."Wallet"
        SET "balance" =
          "balance" + 1
        WHERE "id" = $1;
      `,
      [selected.id]
    );

    const result =
      await client.query(
        `
          WITH ledger_balance AS (
            SELECT
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

            WHERE "walletId" = $1
          )

          SELECT
            w."balance"::TEXT
              AS "walletBalance",

            lb.balance::TEXT
              AS "ledgerBalance",

            (
              w."balance" -
              lb.balance
            )::TEXT
              AS difference

          FROM public."Wallet" w

          CROSS JOIN ledger_balance lb

          WHERE w."id" = $1;
        `,
        [selected.id]
      );

    const difference =
      Number(
        result.rows[0]
          .difference
      );

    console.table(
      result.rows
    );

    if (difference === 0) {
      throw new Error(
        "Detection test failed."
      );
    }

    console.log(
      "✅ Artificial discrepancy detected."
    );
  } finally {
    /*
     * Absolutely nothing from this
     * test persists.
     */
    await client.query(
      "ROLLBACK"
    );
  }

  console.log(
    "✅ Test transaction rolled back."
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
