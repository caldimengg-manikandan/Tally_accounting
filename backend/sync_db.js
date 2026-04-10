const { sequelize } = require('./models');

async function syncDB() {
  try {
    console.log("STARTING DB SYNC...");
    await sequelize.sync({ alter: true });
    console.log("✅ DB SYNC COMPLETED SUCCESSFULLY.");
  } catch (err) {
    console.error("❌ DB SYNC FAILED:", err);
  } finally {
    process.exit();
  }
}

syncDB();
