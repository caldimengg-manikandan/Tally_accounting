const { Company, Group, Ledger, sequelize } = require('../models');

async function find() {
  try {
    await sequelize.authenticate();
    console.log('DB Connection OK');

    const companies = await Company.findAll();
    console.log('\n--- COMPANIES ---');
    for (const c of companies) {
      console.log(`Company ID: ${c.id}, Name: ${c.name}`);
    }

    const targetCompany = companies.find(c => c.name.toLowerCase().includes('murugan'));
    if (!targetCompany) {
      console.log('Company "SRI MURUGAN TRADERS" not found in the DB.');
      return;
    }

    console.log(`\nFound target company ID: ${targetCompany.id} for "${targetCompany.name}"`);

    // Let's check groups for this company
    const groups = await Group.findAll({ where: { CompanyId: targetCompany.id } });
    console.log('\n--- GROUPS FOR TARGET COMPANY ---');
    for (const g of groups) {
      console.log(`Group ID: ${g.id}, Name: ${g.name}, nature: ${g.nature}, category: ${g.category}`);
    }

    // Let's check ledgers for this company
    const ledgers = await Ledger.findAll({
      where: { CompanyId: targetCompany.id },
      include: [{ model: Group, attributes: ['name'] }]
    });
    console.log('\n--- LEDGERS FOR TARGET COMPANY ---');
    for (const l of ledgers) {
      console.log(`Ledger ID: ${l.id}, Name: ${l.name}, Group: ${l.Group?.name || 'NONE'}, GroupId: ${l.GroupId}`);
    }

    // Let's check if there are any ledgers overall with CompanyId null, or if they were mapped to another company by mistake
    const allLedgers = await Ledger.findAll({
      include: [{ model: Group, attributes: ['name'] }]
    });
    console.log('\n--- ALL LEDGERS IN DB ---');
    for (const l of allLedgers) {
      console.log(`Ledger ID: ${l.id}, Name: ${l.name}, Group: ${l.Group?.name || 'NONE'}, GroupId: ${l.GroupId}, CompanyId: ${l.CompanyId}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

find();
