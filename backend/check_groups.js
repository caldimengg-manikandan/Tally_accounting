const { Group, Company, User } = require('./models');

async function check() {
  const company = await Company.findOne();
  if (!company) {
    console.log('No company found.');
    return;
  }
  const groups = await Group.findAll({ where: { CompanyId: company.id } });
  console.log(`Found ${groups.length} groups for company ${company.name}:`);
  groups.forEach(g => {
    console.log(`- ${g.name} (${g.nature})`);
  });
  process.exit(0);
}

check();
