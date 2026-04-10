const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConn() {
  try {
    await client.connect();
    console.log("CONNECTED TO POSTGRES.");
    const res = await client.query('SELECT current_database();');
    console.log("DB NAME:", res.rows[0].current_database);
    
    // Check tables
    const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public';");
    console.log("TABLES FOUND:", tables.rows.map(r => r.table_name).join(', '));
    
    // Check companies
    const companies = await client.query('SELECT id, name FROM "Companies";');
    console.log("COMPANIES IN DB:", companies.rows);

    await client.end();
  } catch (err) {
    console.error("CONN ERROR:", err);
  }
}

testConn();
