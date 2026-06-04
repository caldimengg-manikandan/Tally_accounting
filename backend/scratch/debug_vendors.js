const { Ledger, Group, Company, sequelize } = require('../models');

async function debug() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    const companies = await Company.findAll({ raw: true });
    console.log('\n--- COMPANIES ---');
    companies.forEach(c => {
      console.log(`ID: ${c.id} | Name: "${c.name}"`);
    });

    const groups = await Group.findAll({ raw: true });
    console.log('\n--- GROUPS FOR "Sri Murugan Traders" (eb78e8e7-232d-43a5-be7f-3ea394c946bc) ---');
    groups.filter(g => g.CompanyId === 'eb78e8e7-232d-43a5-be7f-3ea394c946bc').forEach(g => {
      console.log(`GroupID: ${g.id} | Name: "${g.name}"`);
    });

    const ledgers = await Ledger.findAll({
      where: { CompanyId: 'eb78e8e7-232d-43a5-be7f-3ea394c946bc' },
      include: [Group]
    });
    console.log('\n--- LEDGERS FOR "Sri Murugan Traders" (eb78e8e7-232d-43a5-be7f-3ea394c946bc) ---');
    ledgers.forEach(l => {
      console.log(`LedgerID: ${l.id} | Name: "${l.name}" | GroupName: "${l.Group?.name || 'No Group'}" | GroupId: ${l.GroupId} | CompanyId: ${l.CompanyId}`);
    });

  } catch (err) {
    console.error('Debug error:', err);
  } finally {
    await sequelize.close();
  }
}

debug();
