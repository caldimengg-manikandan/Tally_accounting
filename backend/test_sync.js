const { sequelize } = require('./models');

async function doSync() {
  try {
    await sequelize.sync({ alter: true });
    console.log("Sync success!");
  } catch(e) {
    console.error("Sync Error:", e);
  }
}
doSync().then(()=>process.exit(0));
