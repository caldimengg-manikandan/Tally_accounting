require('dotenv').config({ path: '.env' });
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
client.connect().then(() => {
  return client.query('UPDATE "Users" SET "failedLoginAttempts" = 0, "lockedUntil" = NULL WHERE "lockedUntil" IS NOT NULL RETURNING email');
}).then(r => {
  console.log('Unlocked accounts:', r.rows.map(u => u.email));
  client.end();
}).catch(e => { console.error(e.message); client.end(); });
