require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});

async function run() {
  const qi = sequelize.getQueryInterface();
  try {
    // Try renaming "status" to "Status"
    await qi.renameColumn('Attendances', 'status', 'Status');
    console.log('✅ Renamed status -> Status');
  } catch (err) {
    console.error('Rename failed:', err.message);
  }
  process.exit(0);
}

run();
