import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const client = new Client({
  connectionString:
    process.env.DIRECT_URL,
});

try {
  await client.connect();

  const tables =
    await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (
        'AccountingAccount',
        'AccountingPosting',
        'AccountingLine'
      )
      ORDER BY table_name;
    `);

  console.log("Accounting tables:");
  console.table(tables.rows);

  const constraints =
    await client.query(`
      SELECT
        conname AS constraint_name
      FROM pg_constraint
      WHERE conname IN (
        'AccountingAccount_walletId_fkey',
        'AccountingPosting_transactionId_fkey',
        'AccountingLine_postingId_fkey',
        'AccountingLine_accountId_fkey',
        'AccountingLine_amount_positive'
      )
      ORDER BY conname;
    `);

  console.log("Accounting constraints:");
  console.table(constraints.rows);

  const triggers =
    await client.query(`
      SELECT
        event_object_table AS table_name,
        trigger_name
      FROM information_schema.triggers
      WHERE trigger_name IN (
        'AccountingLine_mutation_guard',
        'AccountingPosting_finalize_guard',
        'AccountingPosting_delete_guard'
      )
      ORDER BY trigger_name;
    `);

  console.log("Accounting triggers:");
  console.table(triggers.rows);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end();
}
