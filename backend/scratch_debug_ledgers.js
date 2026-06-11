const { Ledger, Group, Company } = require('./models');

async function run() {
  try {
    const companies = await Company.findAll();
    console.log(`Found ${companies.length} companies:`);
    for (const c of companies) {
      console.log(`- Company ID: ${c.id} | Name: ${c.name}`);
      const ledgers = await Ledger.findAll({
        where: { CompanyId: c.id },
        include: [{ model: Group }],
      });
      console.log(`  Ledgers count: ${ledgers.length}`);
      for (const l of ledgers) {
        console.log(`    * Ledger: "${l.name}" | GroupId: ${l.GroupId} | GroupName (db): "${l.groupName}" | Group Table Name: "${l.Group?.name}" | Group Nature: "${l.Group?.nature}"`);
      }
    }
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

run();
