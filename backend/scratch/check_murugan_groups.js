const { Group, Ledger, sequelize } = require('../models');
const { Op } = require('sequelize');

async function test() {
  const companyId = 'eb78e8e7-232d-43a5-be7f-3ea394c946bc'; //  Sri Murugan Traders
  try {
    await sequelize.authenticate();
    console.log('DB Connection OK');

    // Find groups
    const groups = await Group.findAll({
      where: { CompanyId: companyId }
    });
    console.log('\n--- ALL GROUPS FOR COMPANY ---');
    for (const g of groups) {
      console.log(`Group ID: ${g.id}, Name: "${g.name}", nature: ${g.nature}, category: ${g.category}`);
    }

    // Find creditor groups specifically
    const creditorGroups = await Group.findAll({
      where: { 
        CompanyId: companyId,
        name: {
          [Op.or]: [
            { [Op.like]: '%Creditors%' },
            { [Op.like]: '%Vendors%' },
            { [Op.like]: '%Suppliers%' }
          ]
        }
      }
    });
    console.log('\n--- CREDITOR GROUPS ---');
    for (const g of creditorGroups) {
      console.log(`Group ID: ${g.id}, Name: "${g.name}"`);
    }

    // Find ledgers
    const ledgers = await Ledger.findAll({
      where: { CompanyId: companyId },
      include: [{ model: Group, attributes: ['name'] }]
    });
    console.log('\n--- LEDGERS ---');
    for (const l of ledgers) {
      console.log(`Ledger ID: ${l.id}, Name: "${l.name}", Group: "${l.Group?.name || 'NONE'}", GroupId: ${l.GroupId}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

test();
