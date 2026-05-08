const { Voucher, Transaction, Ledger, sequelize } = require('../models');

async function check() {
  try {
    await sequelize.authenticate();
    console.log('DB Connected');
    
    const count = await Voucher.count();
    console.log('Vouchers Count:', count);
    
    const vouchers = await Voucher.findAll({ 
      limit: 1,
      include: [{
        model: Transaction,
        include: [{ model: Ledger, attributes: ['id', 'name'] }]
      }]
    });
    
    if (vouchers.length > 0) {
      console.log('Sample Voucher structure is OK');
      const v = vouchers[0];
      console.log('Voucher Type:', v.voucherType);
      console.log('Transactions length:', v.Transactions?.length);
      if (v.Transactions && v.Transactions.length > 0) {
        console.log('Sample Transaction Ledger:', v.Transactions[0].Ledger?.name);
      }
    } else {
      console.log('No vouchers found in DB');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('DB Error:', err);
    process.exit(1);
  }
}

check();
