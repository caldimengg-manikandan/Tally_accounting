const { sequelize } = require('./models');

async function queryTable() {
  console.log('Querying SO-TEST-1781265336807 from SalesOrders table...');
  try {
    const [results] = await sequelize.query(`SELECT * FROM "SalesOrders" WHERE "orderNumber" = 'SO-TEST-1781265336807';`);
    if (results.length > 0) {
      console.log('Row found:', results[0]);
    } else {
      console.log('No rows found matching SO-TEST-1781265336807!');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sequelize.close();
  }
}

queryTable();
