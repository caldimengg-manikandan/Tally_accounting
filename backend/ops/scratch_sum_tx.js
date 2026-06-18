const { Transaction } = require('./models');

async function run() {
  const companyId = '5f028981-8de4-4c19-9a90-54257dd87f70';
  const sumDebits = await Transaction.sum('debit', { where: { CompanyId: companyId } });
  const sumCredits = await Transaction.sum('credit', { where: { CompanyId: companyId } });
  console.log(`Direct sum from Transactions table for company ${companyId}:`);
  console.log(`Total Debit: ${sumDebits}`);
  console.log(`Total Credit: ${sumCredits}`);
  process.exit();
}

run();
