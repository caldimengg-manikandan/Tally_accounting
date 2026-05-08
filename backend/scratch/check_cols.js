const { Voucher, Transaction, sequelize } = require('../models');

async function check() {
  try {
    await sequelize.authenticate();
    const [vcols] = await sequelize.query("PRAGMA table_info(Vouchers)");
    console.log('Voucher Columns:', vcols.map(c => c.name).join(', '));
    
    const [tcols] = await sequelize.query("PRAGMA table_info(Transactions)");
    console.log('Transaction Columns:', tcols.map(c => c.name).join(', '));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
