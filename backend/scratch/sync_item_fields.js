const { sequelize } = require('../models');

async function syncDB() {
  try {
    console.log('Authenticating database connection...');
    await sequelize.authenticate();
    console.log('Database connected. Syncing/Altering tables...');
    await sequelize.sync({ alter: true });
    console.log('Database sync complete. New columns synced successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during database sync:', error);
    process.exit(1);
  }
}

syncDB();
