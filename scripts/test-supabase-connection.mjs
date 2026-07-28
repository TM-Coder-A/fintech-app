import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
  console.error("DIRECT_URL is missing.");
  process.exit(1);
}

console.log(
  `DIRECT_URL loaded: ${connectionString.length} characters`
);

const client = new Client({
  connectionString,
});

try {
  await client.connect();

  const result = await client.query(`
    SELECT
      current_database() AS database,
      current_user AS username,
      NOW() AS server_time;
  `);

  console.log("Supabase connection successful.");
  console.table(result.rows);
} catch (error) {
  console.error("Supabase connection failed:");
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
