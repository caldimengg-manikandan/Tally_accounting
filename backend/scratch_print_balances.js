const { Ledger, Group, Transaction, Voucher, Company } = require('./models');
const { Op } = require('sequelize');

async function run() {
  const companyId = '5f028981-8de4-4c19-9a90-54257dd87f70';
  const ledgers = await Ledger.findAll({
    where: { CompanyId: companyId },
    include: [{ model: Group }],
  });

  console.log('--- ALL LEDGERS AND THEIR BALANCES ---');
  for (const l of ledgers) {
    const txs = await Transaction.findAll({ where: { LedgerId: l.id } });
    const debits = txs.reduce((sum, t) => sum + parseFloat(t.debit || 0), 0);
    const credits = txs.reduce((sum, t) => sum + parseFloat(t.credit || 0), 0);
    const open = parseFloat(l.openingBalance || 0);
    const openType = l.openingBalanceType || 'Dr';

    let balance = 0;
    const isDr = ['Assets', 'Expenses'].includes(l.Group?.nature);
    if (isDr) {
      balance = (openType === 'Dr' ? open : -open) + debits - credits;
    } else {
      balance = (openType === 'Cr' ? open : -open) + credits - debits;
    }

    console.log(`Name: ${l.name.padEnd(25)} | Group: ${l.Group?.name.padEnd(20)} (${l.Group?.nature}) | Opening: ${open} ${openType} | Debits: ${debits} | Credits: ${credits} | Closing Bal: ${balance} (${isDr ? 'Dr' : 'Cr'})`);
  }

  process.exit();
}

run();
