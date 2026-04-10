const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkUserCompanies() {
  try {
    await client.connect();
    console.log("CONNECTED.");
    
    // Find user ID for thejathangavel5@gmail.com
    const userRes = await client.query('SELECT id FROM "Users" WHERE email = $1;', ['thejathangavel5@gmail.com']);
    if (userRes.rows.length === 0) {
      console.log("USER NOT FOUND.");
      return;
    }
    const userId = userRes.rows[0].id;
    console.log("USER ID:", userId);

    // Check junction table UserCompanies
    const junctionRes = await client.query('SELECT "companyId" FROM "UserCompanies" WHERE "userId" = $1;', [userId]);
    console.log("LINKED COMPANIES:", junctionRes.rows.length);
    for (const row of junctionRes.rows) {
      const coRes = await client.query('SELECT name FROM "Companies" WHERE id = $1;', [row.companyId]);
      console.log(` - Company: ${coRes.rows[0]?.name} (${row.companyId})`);
    }

    await client.end();
  } catch (err) {
    console.error(err);
  }
}

checkUserCompanies();
