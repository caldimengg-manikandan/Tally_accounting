const { Ledger, sequelize } = require('../models');

async function test() {
  try {
    await sequelize.authenticate();
    const ledgers = await Ledger.findAll({
      where: { name: 'Ravi Electronics' },
      paranoid: false,
      raw: true
    });
    console.log('\n--- RAVI ELECTRONICS RECORD TIMESTAMPS ---');
    ledgers.forEach(l => {
      console.log(`ID: ${l.id} | CompanyId: ${l.CompanyId} | CreatedAt: ${l.createdAt} | UpdatedAt: ${l.updatedAt} | DeletedAt: ${l.deletedAt}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

test();
