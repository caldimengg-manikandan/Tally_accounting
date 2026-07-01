const { Client } = require('pg');

async function test() {
  const client = new Client({
    connectionString: 'postgresql://tally_db_9r2n_user:TYvXg4eOwSLjwHH9qhT5qNncQMkNf9HW@dpg-d8h874cvikkc73evmvbg-a.singapore-postgres.render.com/tally_db_9r2n',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  try {
    const res = await client.query('SELECT "pendingEmail" FROM "Users" LIMIT 1');
    console.log("Success:", res.rows);
  } catch (err) {
    console.error("Query Error:", err.message);
  }
  await client.end();
}
test().catch(console.error);
