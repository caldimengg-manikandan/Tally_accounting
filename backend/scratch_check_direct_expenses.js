const { Group, Ledger } = require('./models');

async function run() {
  const companyId = '5f028981-8de4-4c19-9a90-54257dd87f70';
  const g = await Group.findOne({
    where: { CompanyId: companyId, name: 'Direct Expenses' }
  });
  if (g) {
    console.log(`Group "Direct Expenses" found: ID: ${g.id}`);
    const ledgers = await Ledger.findAll({ where: { GroupId: g.id } });
    console.log(`Ledgers under this group:`, ledgers.map(l => l.name));
  } else {
    console.log(`Group "Direct Expenses" NOT found.`);
  }
  process.exit();
}

run();
