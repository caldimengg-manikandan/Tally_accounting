const { sequelize } = require('./models');

async function debug() {
  try {
    console.log('Attempting to sync database with alter: true...');
    await sequelize.sync({ alter: true });
    console.log('✅ Sync successful!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Sync failed!');
    console.error('Error Name:', err.name);
    console.error('Message:', err.message);
    if (err.errors) {
      err.errors.forEach((e, i) => {
        console.error(`Error ${i + 1}:`, e.message, '| Path:', e.path, '| Value:', e.value);
      });
    }
    process.exit(1);
  }
}

debug();
