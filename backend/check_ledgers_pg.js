const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkLedgers() {
  try {
    await client.connect();
    console.log("CONNECTED.");
    
    const coId = 'b03b1ec3-5f34-4460-9ef5-bda22fb4d360'; // Indus Enterprises
    console.log("CHECKING LEDGERS FOR COMPANY:", coId);

    const ledgers = await client.query('SELECT name, "groupName" FROM "Ledgers" WHERE "CompanyId" = $1;', [coId]);
    console.log("TOTAL LEDGERS:", ledgers.rowCount);
    ledgers.rows.forEach(l => console.log(` - ${l.name} (${l.groupName})`));

    await client.end();
  } catch (err) {
    console.error(err);
  }
}

checkLedgers();
