const { sequelize } = require('../models');

async function checkCols() {
  try {
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Users';
    `);
    console.log('Columns in Users table:');
    console.log(results.map(r => r.column_name).join(', '));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkCols();
