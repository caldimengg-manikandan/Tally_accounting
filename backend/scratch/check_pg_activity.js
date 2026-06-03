const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize(process.env.DATABASE_URL.replace(/(dpg-[a-z0-9-]+)(\/)/, '$1.singapore-postgres.render.com$2'), { 
  dialect: 'postgres',
  logging: false
});

async function run() {
  try {
    console.log("=== Active PG Connections and Queries ===");
    const [queries] = await sequelize.query(`
      SELECT pid, state, query, query_start, now() - query_start AS duration 
      FROM pg_stat_activity 
      WHERE state IS NOT NULL AND query NOT LIKE '%pg_stat_activity%'
      ORDER BY duration DESC
    `);
    queries.forEach(q => {
      console.log(`PID: ${q.pid}, State: ${q.state}, Duration: ${q.duration.minutes || 0}m ${q.duration.seconds || 0}s, Query: ${q.query.substring(0, 100)}`);
    });

    console.log("\n=== Active PG Locks ===");
    const [locks] = await sequelize.query(`
      SELECT pid, locktype, mode, granted 
      FROM pg_locks 
      LIMIT 10
    `);
    locks.forEach(l => {
      console.log(`PID: ${l.pid}, LockType: ${l.locktype}, Mode: ${l.mode}, Granted: ${l.granted}`);
    });
  } catch (err) {
    console.error("Failed to query pg stats:", err);
  } finally {
    await sequelize.close();
  }
}

run();
