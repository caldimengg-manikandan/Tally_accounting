const { Voucher, Transaction, Ledger } = require('./models');

async function run() {
  const v = await Voucher.findOne({
    where: { voucherNumber: 'BNH-001' },
    include: [{ model: Transaction, include: [{ model: Ledger }] }]
  });

  if (v) {
    console.log(`Voucher: ${v.voucherNumber} | Type: ${v.voucherType} | CompanyId: ${v.CompanyId}`);
    v.Transactions.forEach(t => {
      console.log(`  Tx ID: ${t.id} | Ledger Name: ${t.Ledger?.name} | Ledger CompanyId: ${t.Ledger?.CompanyId} | Dr: ${t.debit} | Cr: ${t.credit}`);
    });
  }
  process.exit();
}

run();
