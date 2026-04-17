const { sequelize } = require('../models');

async function testQuery() {
  try {
    console.log("--- Testing different query styles on 'Items' table ---");
    
    const queries = [
      'SELECT "id", "name", "gstRate" FROM "Items" LIMIT 1',
      'SELECT id, name, gstrate FROM Items LIMIT 1',
      'SELECT "id", "name", "gstrate" FROM "Items" LIMIT 1',
      'SELECT "id", "name", "gstRate" FROM "Items" AS "Item" LIMIT 1'
    ];

    for (const q of queries) {
      try {
        console.log(`\nQuery: ${q}`);
        const [res] = await sequelize.query(q);
        console.log("SUCCESS:", res);
      } catch (e) {
        console.log("FAILED:", e.message);
      }
    }

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    process.exit();
  }
}

testQuery();
