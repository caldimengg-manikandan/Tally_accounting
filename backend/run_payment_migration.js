const { Client } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL is not set. Skipping PostgreSQL migrations.');
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('Connected.');

    const sqlPath = path.join(__dirname, 'migrations', '002_add_payment_gateway_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing payment migration...');
    
    // Split statements by semicolon, ignoring empty strings
    // Clean comments and divide safely
    const lines = sql.split('\n');
    let currentStatement = '';
    const statements = [];

    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('--')) {
        continue;
      }
      currentStatement += ' ' + trimmed;
      if (trimmed.endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    for (const stmt of statements) {
      console.log(`Running statement: ${stmt.substring(0, 60)}...`);
      await client.query(stmt);
    }

    console.log('\nMigration executed and tables checked successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
