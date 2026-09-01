import "dotenv/config";
import pg from "pg";

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const client = new pg.Client({ connectionString });
  await client.connect();

  const enums = await client.query(`
    SELECT t.typname, e.enumlabel, e.enumsortorder
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname IN ('CommerceEventType', 'CommerceEventSource')
    ORDER BY t.typname, e.enumsortorder;
  `);

  const count = await client.query('SELECT COUNT(*) FROM "CommerceEvent";');

  console.log("ENUM_ROWS:", enums.rows);
  console.log("COMMERCE_EVENT_COUNT:", count.rows[0].count);

  await client.end();
}

main().catch(console.error);
