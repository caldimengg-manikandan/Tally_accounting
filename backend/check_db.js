const { SalaryComponent, Company } = require('./models');

async function checkDb() {
  const companies = await Company.findAll();
  console.log(`Found ${companies.length} companies.`);
  for (const company of companies) {
    const components = await SalaryComponent.findAll({
      where: { CompanyId: company.id }
    });
    console.log(`Company: ${company.name} (ID: ${company.id}) -> has ${components.length} components`);
    if (components.length > 0) {
      console.log('Component names:', components.map(c => `${c.name} (Active: ${c.isActive})`).join(', '));
    }
  }
  process.exit(0);
}

checkDb();
