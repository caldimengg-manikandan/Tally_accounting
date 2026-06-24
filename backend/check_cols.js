const { Client } = require('pg');

async function checkCols() {
  const client = new Client({
    connectionString: 'postgresql://tally_db_9r2n_user:TYvXg4eOwSLjwHH9qhT5qNncQMkNf9HW@dpg-d8h874cvikkc73evmvbg-a.singapore-postgres.render.com/tally_db_9r2n',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  const res = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'Users';
  `);
  console.log(res.rows.map(r => r.column_name));
  await client.end();
}

checkCols().catch(console.error);
