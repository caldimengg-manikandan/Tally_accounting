const { Client } = require('pg');

async function killLocks() {
  const client = new Client({
    connectionString: 'postgresql://tally_db_9r2n_user:TYvXg4eOwSLjwHH9qhT5qNncQMkNf9HW@dpg-d8h874cvikkc73evmvbg-a.singapore-postgres.render.com/tally_db_9r2n',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  const res = await client.query(`
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = current_database()
      AND pid <> pg_backend_pid()
      AND state in ('idle in transaction', 'active');
  `);
  console.log(`Terminated ${res.rowCount} backend processes.`);
  await client.end();
}

killLocks().catch(console.error);
