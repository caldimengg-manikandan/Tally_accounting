const { sequelize } = require('./models');

async function sync() {
  try {
    await sequelize.authenticate();
    console.log('Connection established.');
    await sequelize.sync({ alter: true });
    console.log('Database synced with alter: true');
    process.exit(0);
  } catch (err) {
    console.error('Error syncing database:', err);
    process.exit(1);
  }
}

sync();
