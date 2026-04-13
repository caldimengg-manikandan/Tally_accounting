const { Company, User, Ledger } = require('./models');

async function check() {
  try {
    const companies = await Company.findAll();
    console.log(`Found ${companies.length} companies:`);
    for (const c of companies) {
      try {
        const customers = await Ledger.count({ 
          where: { CompanyId: c.id },
          include: [{ model: Group, as: 'Group' }],
          // Fallback if groupName column is missing during sync
        });
        console.log(` - ${c.name} (${c.id}) | Total Ledgers: ${customers}`);
      } catch (err) {
        console.log(` - ${c.name} (${c.id}) | ERROR QUERYING LEDGERS: ${err.message}`);
      }
    }

    const users = await User.findAll();
    console.log(`\nFound ${users.length} users:`);
    for (const u of users) {
      const activeCo = companies.find(c => c.id === u.activeCompanyId);
      console.log(` - ${u.name} (${u.email}) | Active Co: ${activeCo ? activeCo.name : 'None'} (${u.activeCompanyId})`);
    }
    process.exit(0);
  } catch (err) {
      console.error(err);
      process.exit(1);
  }
}

check();
