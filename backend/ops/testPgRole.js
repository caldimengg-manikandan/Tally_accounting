const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  let url = dbUrl;
  if (url.includes('dpg-') && !url.includes('.render.com')) {
    url = url.replace(/(dpg-[a-z0-9-]+)(\/)/, '$1.singapore-postgres.render.com$2');
  }
  
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log("Connected directly via pg.");

  const query = `ALTER TABLE "UserCompanies" ADD COLUMN IF NOT EXISTS "role" VARCHAR(255) DEFAULT 'VIEWER';`;
  try {
    await client.query(query);
    console.log("Executed successfully:", query);
  } catch (e) {
    console.error("Failed:", query, "->", e.message);
  }

  const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'UserCompanies'`);
  console.log("Final UserCompanies Columns:", res.rows.map(r => r.column_name).join(", "));

  await client.end();
  console.log("Connection closed gracefully.");
}

run().catch(console.error);
