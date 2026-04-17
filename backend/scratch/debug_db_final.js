const { sequelize } = require('../models');

async function debugDB() {
  try {
    console.log("--- TABLE NAMES ---");
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(JSON.stringify(tables.map(t => t.table_name), null, 2));

    console.log("\n--- 'Items' Table Columns ---");
    const [cols] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Items'
    `);
    console.log(JSON.stringify(cols, null, 2));

  } catch (err) {
    console.error("Debug failed:", err);
  } finally {
    process.exit();
  }
}

debugDB();
