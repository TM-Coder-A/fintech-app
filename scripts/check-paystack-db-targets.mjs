import "dotenv/config";
import pg from "pg";

const { Client } = pg;

async function check(name, connectionString) {
  if (!connectionString) {
    console.log(`${name}: MISSING`);
    return;
  }

  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();

    const result = await client.query(`
      SELECT
        current_database() AS database,
        current_user AS username,
        to_regclass('public."FundingAttempt"') AS funding_attempt;
    `);

    console.log(`\n${name}`);
    console.table(result.rows);
  } catch (error) {
    console.error(
      `${name} connection failed:`,
      error.message
    );
  } finally {
    await client.end().catch(() => {});
  }
}

await check(
  "DIRECT_URL",
  process.env.DIRECT_URL
);

await check(
  "DATABASE_URL",
  process.env.DATABASE_URL
);
