const { sequelize } = require('./models');

async function test() {
  try {
    const [results, metadata] = await sequelize.query("SELECT * FROM \"SalesOrders\" LIMIT 1");
    console.log(results);
  } catch (error) {
    console.error("Query Error:", error.message);
  }
  process.exit();
}

test();
