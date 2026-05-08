const { Voucher, Transaction, Ledger, sequelize } = require('./models');

async function check() {
  try {
    await sequelize.authenticate();
    console.log('DB Connected');
    
    const vouchers = await Voucher.findAll({ limit: 1 });
    console.log('Vouchers Count:', await Voucher.count());
    console.log('Transactions Count:', await Transaction.count());
    
    if (vouchers.length > 0) {
      console.log('Sample Voucher:', JSON.stringify(vouchers[0], null, 2));
    }
    
    process.exit(0);
  } catch (err) {
    console.error('DB Error:', err);
    process.exit(1);
  }
}

check();
