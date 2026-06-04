const { Ledger, Transaction, sequelize } = require('../models');

async function analyze() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const companyId = 'eb78e8e7-232d-43a5-be7f-3ea394c946bc'; // Sri Murugan Traders

    const ledgers = await Ledger.findAll({
      where: { name: 'Ravi Electronics', CompanyId: companyId },
      raw: true
    });

    console.log(`\nFound ${ledgers.length} "Ravi Electronics" ledgers in Sri Murugan Traders:\n`);

    for (const l of ledgers) {
      // Count associated transactions
      const txCount = await Transaction.count({ where: { LedgerId: l.id } });
      
      console.log(`ID: ${l.id}`);
      console.log(`  - email: "${l.email || ''}"`);
      console.log(`  - companyName: "${l.companyName || ''}"`);
      console.log(`  - gstNumber: "${l.gstNumber || ''}"`);
      console.log(`  - openingBalance: ${l.openingBalance}`);
      console.log(`  - currentBalance: ${l.currentBalance}`);
      console.log(`  - Associated Transactions: ${txCount}`);
      console.log(`  - CreatedAt: ${l.createdAt}`);
      console.log('--------------------------------------------------');
    }

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

analyze();
