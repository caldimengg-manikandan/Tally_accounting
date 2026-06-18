require('dotenv').config();
const { sequelize } = require('./models');

async function testQuery() {
  try {
    const res = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Users';
    `);
    console.log("Columns in Users:", res[0].map(c => c.column_name).join(", "));
  } catch (err) {
    console.error("Error:", err.message);
  }
  process.exit(0);
}

testQuery();
