const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const SQL = `
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "pendingEmail" VARCHAR(255);
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "emailVerificationToken" VARCHAR(255);
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "emailVerificationExpiry" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "notificationPreferences" JSON;
`;

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('Connected. Adding missing columns to Users table...');

    await client.query(SQL);

    console.log('Migration complete. Verifying columns...');
    
    const userCols = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Users' 
      AND column_name IN ('pendingEmail', 'emailVerificationToken', 'emailVerificationExpiry', 'notificationPreferences')
    `);
    
    console.log('Found columns:', userCols.rows.map(r => r.column_name));
    console.log('Success!');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
