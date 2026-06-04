const { Company, Group, Ledger, sequelize } = require('./backend/models');

const seedDefaultLedgers = async (companyId, transaction = null) => {
  const options = transaction ? { transaction } : {};

  const defaultLedgers = [
    { name: 'Cash', group: 'Cash-in-Hand' },
    { name: 'Capital Account', group: 'Capital Account' },
    { name: 'Purchase Account', group: 'Purchase Accounts' },
    { name: 'Sales Account', group: 'Sales Accounts' },
    { name: 'CGST Input', group: 'Duties & Taxes' },
    { name: 'CGST Output', group: 'Duties & Taxes' },
    { name: 'SGST Input', group: 'Duties & Taxes' },
    { name: 'SGST Output', group: 'Duties & Taxes' },
    { name: 'IGST Input', group: 'Duties & Taxes' },
    { name: 'IGST Output', group: 'Duties & Taxes' }
  ];

  const groups = await Group.findAll({ where: { CompanyId: companyId }, ...options });
  const groupMap = {};
  groups.forEach(g => { groupMap[g.name] = g.id; });

  let createdCount = 0;

  for (const ledger of defaultLedgers) {
    const groupId = groupMap[ledger.group];
    if (!groupId) continue;

    const existing = await Ledger.findOne({
      where: { name: ledger.name, CompanyId: companyId, GroupId: groupId },
      ...options
    });

    if (!existing) {
      await Ledger.create({
        name: ledger.name,
        groupName: ledger.group,
        GroupId: groupId,
        CompanyId: companyId,
        openingBalance: 0,
        currentBalance: 0
      }, options);
      createdCount++;
    }
  }
  return createdCount;
};

async function run() {
  try {
    const companies = await Company.findAll();
    console.log(`Found ${companies.length} companies to process...`);
    
    for (const company of companies) {
      const count = await seedDefaultLedgers(company.id);
      console.log(`Company ${company.name} (${company.id}): created ${count} default ledgers.`);
    }
    console.log('Seeding complete!');
  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    await sequelize.close();
  }
}

run();
