// Runs a single SQL migration file against DATABASE_URL.
// Usage: npx tsx scripts/run-migration.ts drizzle/migrations/0000_turn_based_messages.sql
import "dotenv/config";
import { readFileSync } from "node:fs";
import pg from "pg";

const file = process.argv[2];
if (!file) {
  console.error("Usage: tsx scripts/run-migration.ts <path-to-sql>");
  process.exit(1);
}

const sql = readFileSync(file, "utf8");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  console.log(`Applying migration: ${file}`);
  await pool.query(sql);
  console.log("Migration applied successfully.");
} catch (err) {
  console.error("Migration failed:", err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
