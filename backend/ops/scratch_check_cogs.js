const { Ledger, Group, Transaction } = require('./models');

async function run() {
  const ledgerName = 'Cost of Goods Sold';
  const l = await Ledger.findOne({
    where: { name: ledgerName },
    include: [{ model: Group }]
  });
  if (l) {
    console.log(`Ledger ID: ${l.id} | Name: ${l.name} | CompanyId: ${l.CompanyId} | GroupId: ${l.GroupId} | GroupName: ${l.Group?.name}`);
    const txCount = await Transaction.count({ where: { LedgerId: l.id } });
    console.log(`Transaction count: ${txCount}`);
  } else {
    console.log(`Ledger "${ledgerName}" not found.`);
  }
  process.exit();
}

run();
