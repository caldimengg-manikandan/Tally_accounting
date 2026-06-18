const { Transaction, Ledger, Voucher } = require('./models');

async function run() {
  const companyId = '5f028981-8de4-4c19-9a90-54257dd87f70';
  const txs = await Transaction.findAll({
    where: { CompanyId: companyId },
    include: [{ model: Ledger }, { model: Voucher }]
  });

  console.log(`Checking ${txs.length} transactions for company ${companyId}...`);
  for (const t of txs) {
    if (!t.Ledger) {
      console.log(`Transaction ID: ${t.id} has no Ledger!`);
      continue;
    }
    if (t.Ledger.CompanyId !== companyId) {
      console.log(`CROSS-COMPANY DETECTED!`);
      console.log(`  Tx ID: ${t.id} | Debit: ${t.debit} | Credit: ${t.credit} | Voucher: ${t.Voucher?.voucherType} #${t.Voucher?.voucherNumber}`);
      console.log(`  Transaction CompanyId: ${t.CompanyId}`);
      console.log(`  Ledger Name: ${t.Ledger.name} (ID: ${t.Ledger.id}) | Ledger CompanyId: ${t.Ledger.CompanyId}`);
    }
  }
  process.exit();
}

run();
