const fs = require('fs');
const { Transaction, Ledger, Voucher } = require('./models');

async function check() {
  const txs = await Transaction.findAll({
    include: [{ model: Ledger, attributes: ['name'] }, { model: Voucher, attributes: ['voucherNumber'] }],
    order: [['id', 'DESC']],
    limit: 10
  });
  fs.writeFileSync('txs.json', JSON.stringify(txs, null, 2));
  process.exit(0);
}
check();
