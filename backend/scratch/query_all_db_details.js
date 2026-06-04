const { User, Company, Group, Ledger, sequelize } = require('../models');

async function dump() {
  try {
    await sequelize.authenticate();
    console.log('DB Connection OK');

    // 1. Get all users and their companies
    const users = await User.findAll({
      include: [Company]
    });
    console.log('\n====================================');
    console.log('USERS AND ASSOCIATED COMPANIES');
    console.log('====================================');
    for (const u of users) {
      console.log(`User: ${u.email} (ID: ${u.id}) [Role: ${u.role}] [ActiveCo: ${u.activeCompanyId}]`);
      if (u.Companies) {
        for (const c of u.Companies) {
          console.log(`  - Company: "${c.name}" (ID: ${c.id})`);
        }
      } else {
        console.log('  - None');
      }
    }

    // 2. Get all companies
    const companies = await Company.findAll();
    console.log('\n====================================');
    console.log('ALL COMPANIES IN DATABASE');
    console.log('====================================');
    for (const c of companies) {
      console.log(`Company ID: ${c.id}, Name: "${c.name}"`);
    }

    // 3. Get all groups for Sri Murugan Traders / SRI MURUGAN TRADERS
    console.log('\n====================================');
    console.log('GROUPS BY COMPANY');
    console.log('====================================');
    for (const c of companies) {
      if (c.name.toLowerCase().includes('murugan')) {
        const groups = await Group.findAll({ where: { CompanyId: c.id } });
        console.log(`Company "${c.name}" (ID: ${c.id}) has ${groups.length} groups:`);
        for (const g of groups) {
          if (g.name.includes('Creditor') || g.name.includes('Debtor')) {
            console.log(`  - Group: "${g.name}" (ID: ${g.id}), category: ${g.category}`);
          }
        }
      }
    }

    // 4. Get all ledgers where name is "Ravi Electronics" or the vendor they saved
    console.log('\n====================================');
    console.log('LEDGERS FOR VENDOR DISCOVERY');
    console.log('====================================');
    const ledgers = await Ledger.findAll({
      include: [{ model: Group, attributes: ['name'] }]
    });
    for (const l of ledgers) {
      // Print ledgers that are likely vendors or have been created recently
      if (l.name.toLowerCase().includes('ravi') || l.name.toLowerCase().includes('murugan') || l.name.toLowerCase().includes('electronics') || l.groupName?.includes('Creditors') || l.Group?.name?.includes('Creditors')) {
        console.log(`Ledger Name: "${l.name}" (ID: ${l.id})`);
        console.log(`  - CompanyId: ${l.CompanyId}`);
        console.log(`  - GroupName (stored): ${l.groupName}`);
        console.log(`  - Group Model Name: ${l.Group?.name}`);
        console.log(`  - GroupId: ${l.GroupId}`);
        console.log(`  - CreatedAt: ${l.createdAt}`);
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

dump();
