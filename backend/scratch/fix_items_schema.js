const { sequelize } = require('../models');

async function fixSchema() {
  try {
    console.log("Starting Schema Fix for Items table...");
    
    // Check existing columns
    const [cols] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Items'
    `);
    
    const existingColumns = cols.map(c => c.column_name);
    console.log("Existing columns:", existingColumns);

    const columnsToAdd = [
      { name: 'gstRate', type: 'DECIMAL(5, 2)', default: '18' },
      { name: 'salesInformation', type: 'BOOLEAN', default: 'true' },
      { name: 'purchaseInformation', type: 'BOOLEAN', default: 'true' },
      { name: 'standardRate', type: 'DECIMAL(15, 2)', default: '0' }
    ];

    for (const col of columnsToAdd) {
      if (!existingColumns.includes(col.name)) {
        console.log(`Adding column ${col.name}...`);
        await sequelize.query(`ALTER TABLE "Items" ADD COLUMN "${col.name}" ${col.type} DEFAULT ${col.default}`);
      }
    }

    console.log("✅ Schema Fix Completed.");

  } catch (err) {
    console.error("❌ Schema Fix Failed:", err);
  } finally {
    process.exit();
  }
}

fixSchema();
