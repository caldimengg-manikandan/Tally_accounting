const { Ledger, Group, Transaction, sequelize } = require('./models');

async function run() {
  const companyId = '5f028981-8de4-4c19-9a90-54257dd87f70';
  const ledgers = await Ledger.findAll({
    where: { CompanyId: companyId },
    include: [
      { model: Group, attributes: ['name', 'nature'] },
      {
        model: Transaction,
        attributes: []
      }
    ],
    attributes: {
      include: [
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('Transactions.debit')), 0), 'totalDebit'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('Transactions.credit')), 0), 'totalCredit']
      ]
    },
    group: ['Ledger.id', 'Group.id'],
    raw: true,
    nest: true
  });

  let sumDebits = 0;
  let sumCredits = 0;
  ledgers.forEach(l => {
    sumDebits += parseFloat(l.totalDebit || 0);
    sumCredits += parseFloat(l.totalCredit || 0);
  });
  console.log(`Sum of totalDebit from query: ${sumDebits}`);
  console.log(`Sum of totalCredit from query: ${sumCredits}`);
  process.exit();
}

run();
