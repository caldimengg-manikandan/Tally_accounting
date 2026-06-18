const { sequelize } = require('./models');

async function queryTable() {
  console.log('Querying one row from SalesOrders table...');
  try {
    const [results] = await sequelize.query(`SELECT * FROM "SalesOrders" LIMIT 1;`);
    if (results.length > 0) {
      console.log('Row found. Keys:', Object.keys(results[0]));
      console.log('Row data:', results[0]);
    } else {
      console.log('No rows found in SalesOrders table!');
      // Let's print table description using pg_attribute
      const [cols] = await sequelize.query(`
        SELECT attname, atttypid::regtype, attnotnull
        FROM pg_attribute
        WHERE attrelid = '"SalesOrders"'::regclass
          AND attnum > 0
          AND NOT attisdropped;
      `);
      console.log('Columns from pg_attribute:');
      cols.forEach(c => {
        console.log(`- ${c.attname} | Type: ${c.atttypid} | NotNull: ${c.attnotnull}`);
      });
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sequelize.close();
  }
}

queryTable();
