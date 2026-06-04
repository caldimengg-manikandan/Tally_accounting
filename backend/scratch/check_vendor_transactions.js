const { Transaction, Voucher, sequelize } = require('../models');

async function check() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const vendorId = 'f1981bd5-4350-4d6a-9575-7c5667b3e746';

    const txs = await Transaction.findAll({
      where: { LedgerId: vendorId },
      include: [{ model: Voucher }],
      raw: true
    });

    console.log(`\nFound ${txs.length} transactions for Ravi Electronics:`);
    txs.forEach(t => {
      console.log(`TxID: ${t.id} | VoucherID: ${t.VoucherId} | VoucherNumber: ${t['Voucher.voucherNumber']} | Date: ${t['Voucher.date']} | Debit: ${t.debit} | Credit: ${t.credit} | description/narration: "${t.description || t['Voucher.narration'] || ''}"`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

check();
