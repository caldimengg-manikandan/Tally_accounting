const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkMoonLedgers() {
  try {
    await client.connect();
    console.log("CONNECTED.");
    
    const coId = '5f028981-8de4-4c19-9a90-54257dd87f70';
    console.log("CHECKING DATA FOR: The MOON Enterprises (" + coId + ")");

    const ledgers = await client.query('SELECT name FROM "Ledgers" WHERE "CompanyId" = $1;', [coId]);
    console.log("TOTAL LEDGERS:", ledgers.rowCount);
    ledgers.rows.forEach(l => console.log(` - ${l.name}`));

    const vouchers = await client.query('SELECT id FROM "Vouchers" WHERE "CompanyId" = $1;', [coId]);
    console.log("TOTAL VOUCHERS:", vouchers.rowCount);

    await client.end();
  } catch (err) {
    console.error(err);
  }
}

checkMoonLedgers();
