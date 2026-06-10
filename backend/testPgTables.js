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

  const res = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
  console.log("Tables:", res.rows.map(r => r.table_name).join(", "));

  await client.end();
}

run().catch(console.error);
