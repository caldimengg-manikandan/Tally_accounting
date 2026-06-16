const { sequelize, SalaryStructure } = require('./models');

async function syncDb() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    
    await SalaryStructure.sync({ alter: true });
    console.log('SalaryStructure synced');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

syncDb();
