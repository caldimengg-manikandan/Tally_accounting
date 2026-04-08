const { Group, Company } = require('./models');

async function checkGroups() {
  try {
    const companies = await Company.findAll({ raw: true });
    for (const co of companies) {
      console.log(`\n--- GROUPS FOR ${co.name} ---`);
      const groups = await Group.findAll({ where: { CompanyId: co.id }, raw: true });
      groups.forEach(g => console.log(` - ${g.name}`));
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkGroups();
