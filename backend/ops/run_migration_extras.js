/**
 * run_migration_extras.js
 * Adds failedLoginAttempts and lockedUntil columns to the Users table.
 * Run once: node run_migration_extras.js
 */
const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const SQL = `
ALTER TABLE "Users"
  ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Users"
  ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP WITH TIME ZONE NULL;
`;

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log('Connected. Running extras migration...');
    await client.query(SQL);

    const res = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'Users' AND column_name IN ('failedLoginAttempts','lockedUntil')
    `);
    const found = res.rows.map(r => r.column_name);
    console.log('"Users"."failedLoginAttempts":', found.includes('failedLoginAttempts') ? '✅ EXISTS' : '❌ MISSING');
    console.log('"Users"."lockedUntil":', found.includes('lockedUntil') ? '✅ EXISTS' : '❌ MISSING');
    console.log('\nDone!');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}
run();
