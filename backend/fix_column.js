require('dotenv').config({ path: './backend/.env' });
const { sequelize } = require('./models');

async function fix() {
  try {
    const [tables] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public';");
    console.log('Available tables:', tables.map(t => t.table_name).join(', '));
    
    // Check if it's 'Users' or 'User' (Sequelize pluralization)
    const tableName = tables.find(t => t.table_name.toLowerCase() === 'users') ? 'Users' : 'User';
    console.log(`Adding "activeCompanyId" column to "${tableName}" table (Postgres)...`);
    
    await sequelize.query(`ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "activeCompanyId" UUID;`);
    
    console.log('✅ Column successfully added to Postgres!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to add column!');
    console.error(err.message);
    process.exit(1);
  }
}

fix();
