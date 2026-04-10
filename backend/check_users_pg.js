const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkUsers() {
  try {
    await client.connect();
    console.log("CONNECTED.");
    
    const res = await client.query('SELECT id, name, email, role FROM "Users";');
    console.log("USERS IN DB:", res.rows.length);
    res.rows.forEach(u => console.log(` - ${u.name} (${u.email}) [${u.role}]`));

    await client.end();
  } catch (err) {
    console.error(err);
  }
}

checkUsers();
