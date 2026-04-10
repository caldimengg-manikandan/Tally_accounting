const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkIndusUsers() {
  try {
    await client.connect();
    console.log("CONNECTED.");
    
    const coId = 'b03b1ec3-5f34-4460-9ef5-bda22fb4d360';
    console.log("CHECKING USERS FOR COMPANY: Indus Enterprises Private Limited (" + coId + ")");

    const res = await client.query('SELECT "userId" FROM "UserCompanies" WHERE "companyId" = $1;', [coId]);
    console.log("LINKED USERS:", res.rows.length);
    for (const row of res.rows) {
      const uRes = await client.query('SELECT name, email FROM "Users" WHERE id = $1;', [row.userId]);
      console.log(` - User: ${uRes.rows[0]?.name} (${uRes.rows[0]?.email})`);
    }

    await client.end();
  } catch (err) {
    console.error(err);
  }
}

checkIndusUsers();
