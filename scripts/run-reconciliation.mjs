import "dotenv/config";

import {
  randomUUID,
} from "crypto";

import pg from "pg";

const { Client } = pg;

const connectionString =
  process.env.DIRECT_URL;

if (!connectionString) {
  console.error(
    "DIRECT_URL is missing."
  );

  process.exit(1);
}

const client = new Client({
  connectionString,
});

const runId =
  randomUUID();

function maskAccount(
  accountNumber
) {
  if (!accountNumber) {
    return "Unknown";
  }

  return `******${accountNumber.slice(-4)}`;
}

async function main() {
  await client.connect();

  console.log("");
  console.log(
    "DAY 44 FINANCIAL RECONCILIATION"
  );

  console.log(
    "================================"
  );

  await client.query(
    `
      INSERT INTO
        public."ReconciliationRun"
      (
        "id",
        "status",
        "startedAt"
      )
      VALUES (
        $1,
        'RUNNING',
        CURRENT_TIMESTAMP
      );
    `,
    [runId]
  );

  /*
   * ------------------------------------------------
   * 1. WALLET vs LEDGER vs ACCOUNTING
   * ------------------------------------------------
   */

  const walletResult =
    await client.query(`
      WITH ledger_balances AS (
        SELECT
          "walletId",

          SUM(
            CASE
              WHEN "direction" = 'CREDIT'
                THEN "amount"

              WHEN "direction" = 'DEBIT'
                THEN -"amount"

              ELSE 0
            END
          ) AS "ledgerBalance"

        FROM public."LedgerEntry"

        GROUP BY "walletId"
      ),

      accounting_balances AS (
        SELECT
          a."walletId",

          COALESCE(
            SUM(
              CASE
                WHEN p."postedAt" IS NULL
                  THEN 0

                WHEN l."side" = 'CREDIT'
                  THEN l."amount"

                WHEN l."side" = 'DEBIT'
                  THEN -l."amount"

                ELSE 0
              END
            ),
            0
          ) AS "accountingBalance"

        FROM public."AccountingAccount" a

        LEFT JOIN public."AccountingLine" l
          ON l."accountId" =
             a."id"

        LEFT JOIN public."AccountingPosting" p
          ON p."id" =
             l."postingId"

        WHERE
          a."walletId" IS NOT NULL

        GROUP BY
          a."walletId"
      )

      SELECT
        w."id",
        w."accountNumber",

        w."balance"::TEXT
          AS "walletBalance",

        COALESCE(
          lb."ledgerBalance",
          0
        )::TEXT
          AS "ledgerBalance",

        COALESCE(
          ab."accountingBalance",
          0
        )::TEXT
          AS "accountingBalance",

        (
          w."balance" -
          COALESCE(
            lb."ledgerBalance",
            0
          )
        )::TEXT
          AS "ledgerDifference",

        (
          w."balance" -
          COALESCE(
            ab."accountingBalance",
            0
          )
        )::TEXT
          AS "accountingDifference",

        (
          COALESCE(
            lb."ledgerBalance",
            0
          )
          -
          COALESCE(
            ab."accountingBalance",
            0
          )
        )::TEXT
          AS "bookDifference"

      FROM public."Wallet" w

      LEFT JOIN ledger_balances lb
        ON lb."walletId" =
           w."id"

      LEFT JOIN accounting_balances ab
        ON ab."walletId" =
           w."id"

      ORDER BY
        w."createdAt";
    `);

  const walletIssues =
    walletResult.rows
      .filter((row) =>
        Number(
          row.ledgerDifference
        ) !== 0 ||
        Number(
          row.accountingDifference
        ) !== 0 ||
        Number(
          row.bookDifference
        ) !== 0
      )
      .map((row) => ({
        walletId: row.id,

        account:
          maskAccount(
            row.accountNumber
          ),

        walletBalance:
          row.walletBalance,

        ledgerBalance:
          row.ledgerBalance,

        accountingBalance:
          row.accountingBalance,

        ledgerDifference:
          row.ledgerDifference,

        accountingDifference:
          row.accountingDifference,

        bookDifference:
          row.bookDifference,
      }));

  console.log("");
  console.log(
    "1. Wallet reconciliation"
  );

  console.log(
    `Wallets checked: ${walletResult.rowCount}`
  );

  console.log(
    `Discrepancies: ${walletIssues.length}`
  );

  /*
   * ------------------------------------------------
   * 2. LEDGER ARITHMETIC
   * ------------------------------------------------
   */

  const ledgerErrors =
    await client.query(`
      SELECT
        "id",
        "entryReference",
        "walletId",
        "direction",
        "amount"::TEXT,
        "balanceBefore"::TEXT,
        "balanceAfter"::TEXT

      FROM public."LedgerEntry"

      WHERE
        (
          "direction" = 'CREDIT'
          AND
          "balanceAfter"
            <>
          "balanceBefore"
            + "amount"
        )

        OR

        (
          "direction" = 'DEBIT'
          AND
          "balanceAfter"
            <>
          "balanceBefore"
            - "amount"
        );
    `);

  console.log("");
  console.log(
    "2. Ledger arithmetic"
  );

  console.log(
    `Errors: ${ledgerErrors.rowCount}`
  );

  /*
   * ------------------------------------------------
   * 3. ACCOUNTING BALANCE
   * ------------------------------------------------
   */

  const accountingErrors =
    await client.query(`
      SELECT
        p."id",
        p."reference",

        SUM(
          CASE
            WHEN l."side" = 'DEBIT'
              THEN l."amount"
            ELSE 0
          END
        )::TEXT
          AS "debits",

        SUM(
          CASE
            WHEN l."side" = 'CREDIT'
              THEN l."amount"
            ELSE 0
          END
        )::TEXT
          AS "credits",

        COUNT(l."id")
          AS "lineCount",

        COUNT(
          DISTINCT l."currency"
        ) AS "currencyCount"

      FROM public."AccountingPosting" p

      JOIN public."AccountingLine" l
        ON l."postingId" =
           p."id"

      WHERE
        p."postedAt" IS NOT NULL

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
        )

        OR COUNT(l."id") < 2

        OR COUNT(
          DISTINCT l."currency"
        ) <> 1;
    `);

  console.log("");
  console.log(
    "3. Accounting postings"
  );

  console.log(
    `Invalid postings: ${accountingErrors.rowCount}`
  );

  /*
   * ------------------------------------------------
   * 4. UNFINISHED ACCOUNTING POSTINGS
   * ------------------------------------------------
   */

  const unfinished =
    await client.query(`
      SELECT
        "id",
        "reference",
        "createdAt"

      FROM public."AccountingPosting"

      WHERE
        "postedAt" IS NULL;
    `);

  console.log("");
  console.log(
    "4. Unfinished postings"
  );

  console.log(
    `Unfinished: ${unfinished.rowCount}`
  );

  /*
   * ------------------------------------------------
   * 5. NEW FINANCIAL TRANSACTION COVERAGE
   * ------------------------------------------------
   *
   * Day-43 opening posting marks our
   * accounting cutover.
   */

  const coverageErrors =
    await client.query(`
      WITH cutover AS (
        SELECT
          MAX("createdAt")
            AS "cutoverAt"

        FROM public."AccountingPosting"

        WHERE
          "reference"
          LIKE
          'ACCOUNTING-OPENING-%'
      )

      SELECT
        t."id",
        t."reference",
        t."type",

        COUNT(
          DISTINCT le."id"
        ) AS "ledgerCount",

        COUNT(
          DISTINCT ap."id"
        ) AS "postingCount",

        COUNT(
          DISTINCT al."id"
        ) AS "accountingLineCount"

      FROM public."Transaction" t

      CROSS JOIN cutover c

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
        c."cutoverAt"
          IS NOT NULL

        AND
        t."createdAt" >
          c."cutoverAt"

        AND
        t."status" =
          'SUCCESSFUL'

        AND
        t."type" IN (
          'TRANSFER',
          'FUNDING'
        )

      GROUP BY
        t."id",
        t."reference",
        t."type"

      HAVING
        (
          t."type" = 'TRANSFER'
          AND (
            COUNT(
              DISTINCT le."id"
            ) <> 2

            OR

            COUNT(
              DISTINCT ap."id"
            ) <> 1

            OR

            COUNT(
              DISTINCT al."id"
            ) <> 2
          )
        )

        OR

        (
          t."type" = 'FUNDING'
          AND (
            COUNT(
              DISTINCT le."id"
            ) <> 1

            OR

            COUNT(
              DISTINCT ap."id"
            ) <> 1

            OR

            COUNT(
              DISTINCT al."id"
            ) <> 2
          )
        );
    `);

  console.log("");
  console.log(
    "5. Transaction coverage"
  );

  console.log(
    `Coverage errors: ${coverageErrors.rowCount}`
  );

  /*
   * ------------------------------------------------
   * SUMMARY
   * ------------------------------------------------
   */

  const discrepancyCount =
    walletIssues.length;

  const ledgerErrorCount =
    ledgerErrors.rowCount ?? 0;

  const accountingErrorCount =
    accountingErrors.rowCount ?? 0;

  const unfinishedCount =
    unfinished.rowCount ?? 0;

  const coverageErrorCount =
    coverageErrors.rowCount ?? 0;

  const totalIssues =
    discrepancyCount +
    ledgerErrorCount +
    accountingErrorCount +
    unfinishedCount +
    coverageErrorCount;

  const status =
    totalIssues === 0
      ? "PASSED"
      : "ISSUES_FOUND";

  const report = {
    runId,

    generatedAt:
      new Date().toISOString(),

    summary: {
      walletCount:
        walletResult.rowCount ?? 0,

      walletDiscrepancies:
        discrepancyCount,

      ledgerErrors:
        ledgerErrorCount,

      accountingErrors:
        accountingErrorCount,

      unfinishedPostings:
        unfinishedCount,

      transactionCoverageErrors:
        coverageErrorCount,

      totalIssues,
    },

    walletIssues,

    ledgerErrors:
      ledgerErrors.rows,

    accountingErrors:
      accountingErrors.rows,

    unfinishedPostings:
      unfinished.rows,

    transactionCoverageErrors:
      coverageErrors.rows,
  };

  await client.query(
    `
      UPDATE
        public."ReconciliationRun"

      SET
        "status" = $2,
        "walletCount" = $3,
        "discrepancyCount" = $4,
        "ledgerErrorCount" = $5,
        "accountingErrorCount" = $6,
        "unfinishedPostingCount" = $7,
        "transactionCoverageErrors" = $8,
        "report" = $9::JSONB,
        "completedAt" =
          CURRENT_TIMESTAMP

      WHERE "id" = $1;
    `,
    [
      runId,
      status,
      walletResult.rowCount ?? 0,
      discrepancyCount,
      ledgerErrorCount,
      accountingErrorCount,
      unfinishedCount,
      coverageErrorCount,
      JSON.stringify(report),
    ]
  );

  /*
   * Record a system-level audit event.
   * userId remains NULL because this is
   * an operational reconciliation task,
   * not a customer's action.
   */

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
        $2,
        $3,
        'RECONCILIATION',
        $4,
        $5::JSONB,
        CURRENT_TIMESTAMP
      );
    `,
    [
      randomUUID(),

      status === "PASSED"
        ? "RECONCILIATION_PASSED"
        : "RECONCILIATION_DISCREPANCY",

      status === "PASSED",

      runId,

      JSON.stringify(
        report.summary
      ),
    ]
  );

  console.log("");
  console.log(
    "================================"
  );

  console.log(
    "RECONCILIATION SUMMARY"
  );

  console.log(
    "================================"
  );

  console.log(
    "Wallets checked:",
    walletResult.rowCount
  );

  console.log(
    "Wallet discrepancies:",
    discrepancyCount
  );

  console.log(
    "Ledger errors:",
    ledgerErrorCount
  );

  console.log(
    "Accounting errors:",
    accountingErrorCount
  );

  console.log(
    "Unfinished postings:",
    unfinishedCount
  );

  console.log(
    "Coverage errors:",
    coverageErrorCount
  );

  console.log(
    "Total issues:",
    totalIssues
  );

  console.log(
    "Status:",
    status
  );

  console.log(
    "Run ID:",
    runId
  );

  if (walletIssues.length) {
    console.log("");
    console.log(
      "Wallet discrepancies:"
    );

    console.table(
      walletIssues
    );
  }

  if (totalIssues !== 0) {
    process.exitCode = 1;
  } else {
    console.log("");
    console.log(
      "✅ Financial reconciliation passed."
    );
  }
}

main()
  .catch(async (error) => {
    console.error("");
    console.error(
      "❌ Reconciliation execution failed."
    );

    console.error(error);

    try {
      await client.query(
        `
          UPDATE
            public."ReconciliationRun"

          SET
            "status" = 'ERROR',
            "completedAt" =
              CURRENT_TIMESTAMP

          WHERE "id" = $1;
        `,
        [runId]
      );
    } catch {
      // Preserve original failure.
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end().catch(() => {});
  });
