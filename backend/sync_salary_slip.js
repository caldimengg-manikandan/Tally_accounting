const { SalarySlip } = require('./models');

async function syncDb() {
  try {
    await SalarySlip.sync({ alter: true });
    console.log('SalarySlip table synced successfully.');
    process.exit(0);
  } catch (e) {
    console.error('Error syncing SalarySlip:', e);
    process.exit(1);
  }
}

syncDb();
