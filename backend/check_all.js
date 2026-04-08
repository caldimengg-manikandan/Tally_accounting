const { Ledger, Group, Company } = require('./models');

async function checkAll() {
  try {
    const companies = await Company.findAll({ raw: true });
    console.log("TOTAL COMPANIES:", companies.length);
    for (const co of companies) {
      console.log(`\n--- COMPANY: ${co.name} (${co.id}) ---`);
      const groups = await Group.count({ where: { CompanyId: co.id } });
      const ledgers = await Ledger.findAll({ where: { CompanyId: co.id }, raw: true });
      console.log(`GROUPS: ${groups}`);
      console.log(`LEDGERS: ${ledgers.length}`);
      ledgers.forEach(l => console.log(` - ${l.name}`));
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkAll();
