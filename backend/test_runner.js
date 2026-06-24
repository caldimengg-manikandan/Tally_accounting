const { sequelize } = require('./models');

async function main() {
  try {
    console.log('Syncing database...');
    await sequelize.sync({ alter: true });
    console.log('Database synced. Running tests...');
    
    // Import and run the test
    const { runTests } = require('./tests/accounting.test.js');
    // If the test has its own self-execute, it will run.
  } catch (err) {
    console.error('CRITICAL RUNNER ERROR:', err);
  }
}

main();
