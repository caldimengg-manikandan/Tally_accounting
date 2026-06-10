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

  const query = `ALTER TABLE "Transactions" ADD COLUMN "postingDate" TIMESTAMP WITH TIME ZONE;`;
  try {
    const res = await client.query(query);
    console.log("Executed successfully:", query);
  } catch (e) {
    console.error("Failed:", query, "->", e.message);
  }

  await client.end();
}

run().catch(console.error);
