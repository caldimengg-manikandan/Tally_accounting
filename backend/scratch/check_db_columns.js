
require('dotenv').config();
const { sequelize } = require('../models');

async function checkColumns() {
  try {
    const [res] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'Ledgers'");
    console.log('Columns in DB:', res.map(r => r.column_name));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkColumns();
