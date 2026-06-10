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

  const query = `ALTER TABLE "UserCompanies" ADD COLUMN "role" VARCHAR(255) DEFAULT 'VIEWER';`;
  try {
    const res = await client.query(query);
    console.log("Executed successfully:", query);
  } catch (e) {
    console.error("Failed:", query, "->", e.message);
  }

  // Update existing rows
  try {
    await client.query(`UPDATE "UserCompanies" SET "role" = 'SUPER_ADMIN';`);
    console.log("Updated roles to SUPER_ADMIN.");
  } catch(e) {}

  await client.end();
}

run().catch(console.error);
