require('dotenv').config();
const { sequelize } = require('./models');

async function testSync() {
  try {
    await sequelize.sync({ alter: true });
    console.log("Sync successful");
  } catch (err) {
    console.error("Sync error:", err.message);
    console.error(err.sql);
    console.error(err.stack);
  } finally {
    process.exit(0);
  }
}

testSync();
