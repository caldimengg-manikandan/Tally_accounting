const { PayrollSettings } = require('./models');

async function syncDB() {
  try {
    console.log("Syncing PayrollSettings table...");
    await PayrollSettings.sync({ alter: true });
    console.log("Successfully altered PayrollSettings table!");
    process.exit(0);
  } catch (err) {
    console.error("Error syncing DB:");
    console.error(err);
    process.exit(1);
  }
}

syncDB();
