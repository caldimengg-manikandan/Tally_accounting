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

  const queries = [
    `ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "mfaSecret" VARCHAR(255);`,
    `ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "mfaEnabled" BOOLEAN DEFAULT false;`,
    `ALTER TABLE "Transactions" ADD COLUMN IF NOT EXISTS "postingDate" TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE "Groups" ADD COLUMN IF NOT EXISTS "hierarchyPath" VARCHAR(255);`
  ];

  for (const q of queries) {
    try {
      await client.query(q);
      console.log("Executed successfully:", q);
    } catch (e) {
      console.error("Failed:", q, "->", e.message);
    }
  }

  const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'Users'`);
  console.log("Final Users Columns:", res.rows.map(r => r.column_name).join(", "));

  await client.end();
  console.log("Connection closed gracefully.");
}

run().catch(console.error);
