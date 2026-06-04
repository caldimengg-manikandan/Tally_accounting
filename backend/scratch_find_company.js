const { Company, Voucher, Ledger, Transaction } = require('./models');

async function run() {
  const companies = await Company.findAll();
  for (const c of companies) {
    const vCount = await Voucher.count({ where: { CompanyId: c.id } });
    const lCount = await Ledger.count({ where: { CompanyId: c.id } });
    const tCount = await Transaction.count({ where: { CompanyId: c.id } });
    console.log(`Company: ${c.name} (ID: ${c.id}) | Vouchers: ${vCount} | Ledgers: ${lCount} | Transactions: ${tCount}`);
  }
  process.exit();
}

run();
