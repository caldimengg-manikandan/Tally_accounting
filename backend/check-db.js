const { sequelize } = require('./models');

async function checkDb() {
  try {
    await sequelize.authenticate();
    
    // Check tables
    const [results] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'PayrollSettings';
    `);
    
    console.log("Columns in PayrollSettings:", results);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

checkDb();
