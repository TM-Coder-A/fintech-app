import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const connectionString =
  process.env.DIRECT_URL;

if (!connectionString) {
  console.error("DIRECT_URL is missing.");
  process.exit(1);
}

const client = new Client({
  connectionString,
});

const sql = `
BEGIN;

DO $$
BEGIN
  CREATE TYPE "ReconciliationStatus"
  AS ENUM (
    'RUNNING',
    'PASSED',
    'ISSUES_FOUND',
    'ERROR'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS
public."ReconciliationRun" (
  "id" TEXT NOT NULL,
  "status" "ReconciliationStatus"
    NOT NULL DEFAULT 'RUNNING',

  "walletCount" INTEGER
    NOT NULL DEFAULT 0,

  "discrepancyCount" INTEGER
    NOT NULL DEFAULT 0,

  "ledgerErrorCount" INTEGER
    NOT NULL DEFAULT 0,

  "accountingErrorCount" INTEGER
    NOT NULL DEFAULT 0,

  "unfinishedPostingCount" INTEGER
    NOT NULL DEFAULT 0,

  "transactionCoverageErrors" INTEGER
    NOT NULL DEFAULT 0,

  "report" JSONB,

  "startedAt" TIMESTAMP(3)
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  "completedAt" TIMESTAMP(3),

  CONSTRAINT "ReconciliationRun_pkey"
    PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS
"ReconciliationRun_status_idx"
ON public."ReconciliationRun" ("status");

CREATE INDEX IF NOT EXISTS
"ReconciliationRun_startedAt_idx"
ON public."ReconciliationRun" ("startedAt");

COMMIT;
`;

try {
  await client.connect();

  console.log(
    "Connected to Supabase."
  );

  await client.query(sql);

  console.log(
    "Day 44 reconciliation database setup completed."
  );

  const result =
    await client.query(`
      SELECT
        table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name =
        'ReconciliationRun';
    `);

  console.table(result.rows);
} catch (error) {
  console.error(
    "Day 44 database setup failed:"
  );

  console.error(error);

  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
