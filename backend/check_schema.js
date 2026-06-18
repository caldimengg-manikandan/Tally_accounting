const { sequelize } = require('./backend/models');

async function check() {
  try {
    const tableInfo = await sequelize.queryInterface.describeTable('SalesInvoices');
    console.log(Object.keys(tableInfo));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
check();
