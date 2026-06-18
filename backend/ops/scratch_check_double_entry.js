const { Voucher, Transaction, Ledger, Group } = require('./models');

async function run() {
  const companyId = '5f028981-8de4-4c19-9a90-54257dd87f70';
  const vouchers = await Voucher.findAll({
    where: { CompanyId: companyId },
    include: [{ model: Transaction, include: [{ model: Ledger }] }]
  });

  console.log('--- VOUCHERS AND DOUBLE-ENTRY BALANCING ---');
  vouchers.forEach(v => {
    const debits = v.Transactions?.reduce((sum, t) => sum + parseFloat(t.debit || 0), 0) || 0;
    const credits = v.Transactions?.reduce((sum, t) => sum + parseFloat(t.credit || 0), 0) || 0;
    const diff = debits - credits;
    console.log(`VoucherType: ${v.voucherType.padEnd(10)} | No: ${v.voucherNumber.padEnd(10)} | Date: ${v.date} | Debits: ${debits.toFixed(2).padStart(10)} | Credits: ${credits.toFixed(2).padStart(10)} | Diff: ${diff.toFixed(2).padStart(8)}`);
    if (Math.abs(diff) > 0.01) {
      console.log('  Transactions:');
      v.Transactions.forEach(t => {
        console.log(`    Ledger: ${t.Ledger?.name} | Dr: ${t.debit} | Cr: ${t.credit}`);
      });
    }
  });

  process.exit();
}

run();
