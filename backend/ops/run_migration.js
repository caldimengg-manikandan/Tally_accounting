/**
 * run_migration.js
 * Runs 001_add_auth_columns.sql against the Render PostgreSQL database
 * using the DATABASE_URL from your .env file.
 *
 * Usage: node run_migration.js
 */

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const SQL = `
-- Phase 1: Block password login for Google OAuth accounts
ALTER TABLE "Users"
  ADD COLUMN IF NOT EXISTS "oauthOnly" BOOLEAN NOT NULL DEFAULT false;

-- Phase 2: Replay detection for refresh token rotation
ALTER TABLE "RefreshTokens"
  ADD COLUMN IF NOT EXISTS "used" BOOLEAN NOT NULL DEFAULT false;

-- Phase 3: MFA secrets table
CREATE TABLE IF NOT EXISTS "MfaSecrets" (
  "id"        UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId"    UUID NOT NULL UNIQUE,
  "secret"    VARCHAR(255) NOT NULL,
  "verified"  BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
`;

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Render hosted Postgres
  });

  try {
    console.log('Connecting to Render PostgreSQL...');
    await client.connect();
    console.log('Connected. Running migration...\n');

    await client.query(SQL);

    console.log('Migration complete. Verifying columns exist...\n');

    // Verify Users.oauthOnly
    const userCols = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'Users' AND column_name = 'oauthOnly'
    `);
    console.log('"Users"."oauthOnly":', userCols.rows.length > 0 ? '✅ EXISTS' : '❌ MISSING');

    // Verify RefreshTokens.used
    const rtCols = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'RefreshTokens' AND column_name = 'used'
    `);
    console.log('"RefreshTokens"."used":', rtCols.rows.length > 0 ? '✅ EXISTS' : '❌ MISSING');

    // Verify MfaSecrets table
    const mfaTable = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'MfaSecrets'
    `);
    console.log('"MfaSecrets" table:', mfaTable.rows.length > 0 ? '✅ EXISTS' : '❌ MISSING');

    console.log('\nAll done! You can now deploy your backend.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
