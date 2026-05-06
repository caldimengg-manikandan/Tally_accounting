require('dotenv').config();
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL + '?sslmode=require',
  ssl: { rejectUnauthorized: false }
});
client.connect()
  .then(() => { console.log('Connected'); return client.query('SELECT 1'); })
  .then(() => console.log('Query success'))
  .catch(err => console.error('Error:', err))
  .finally(() => client.end());
