const { sequelize, PayrollSettings } = require('./models');

async function syncDb() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    
    await PayrollSettings.sync({ alter: true });
    console.log('PayrollSettings synced');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

syncDb();
