const { Ledger, Group } = require('../models');

async function checkLedgers() {
  const companyId = '5f028981-8de4-4c19-9a90-54257dd87f70';
  try {
    const ledgers = await Ledger.findAll({
      where: { CompanyId: companyId },
      include: [{ model: Group, attributes: ['id', 'name', 'nature'] }]
    });
    console.log('Ledgers for The MOON Enterprises:', ledgers.length);
    const customers = ledgers.filter(l => 
      l.Group?.name?.toLowerCase().includes('debtor') || 
      l.groupName?.toLowerCase().includes('debtor')
    );
    console.log('Customer ledgers found:', customers.length);
    if (customers.length > 0) {
      console.log('Sample Customer:', customers[0].name, 'Group:', customers[0].Group?.name);
    }
  } catch (err) {
    console.error('Check failed:', err.message);
  } finally {
    const { sequelize } = require('../models');
    await sequelize.close();
  }
}

checkLedgers();
