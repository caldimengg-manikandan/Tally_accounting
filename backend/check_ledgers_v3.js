const { Ledger, Group, Company } = require('./models');

async function checkLedgers() {
  try {
    const allCompanies = await Company.findAll();
    console.log(`TOTAL COMPANIES: ${allCompanies.length}`);
    for (const co of allCompanies) {
        const count = await Ledger.count({ where: { CompanyId: co.id } });
        console.log(`- ${co.name} (${co.id}): ${count} ledgers`);
        if (count > 0) {
            const ledgers = await Ledger.findAll({ where: { CompanyId: co.id }, include: [Group] });
            ledgers.forEach(l => {
                console.log(`  * [${l.id}] ${l.name} | Group: ${l.Group?.name}`);
            });
        }
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkLedgers();
