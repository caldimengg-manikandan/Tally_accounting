const { Ledger, Group, Company, sequelize } = require('../models');

async function repair() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const sourceCompanyId = 'f9e9b818-52ea-4ab1-a524-9a891917899d'; // Test Company
    const targetCompanyId = 'eb78e8e7-232d-43a5-be7f-3ea394c946bc'; // Sri Murugan Traders

    const targetCompany = await Company.findByPk(targetCompanyId);
    if (!targetCompany) {
      console.error('Target company Sri Murugan Traders not found.');
      return;
    }
    console.log(`Target company: "${targetCompany.name}" (ID: ${targetCompany.id})`);

    // Fetch all ledgers belonging to the source company
    const sourceLedgers = await Ledger.findAll({
      where: { CompanyId: sourceCompanyId },
      include: [Group]
    });

    console.log(`Found ${sourceLedgers.length} ledgers to migrate from Test Company.`);

    for (const ledger of sourceLedgers) {
      // Find the group name of this ledger
      let gName = ledger.Group?.name || ledger.groupName;
      if (!gName || gName === 'null') {
        gName = 'Sundry Creditors'; // fallback
      }

      console.log(`\nMigrating Ledger: "${ledger.name}" (ID: ${ledger.id}) | Group: "${gName}"`);

      // Find or create the same group name under target company
      let targetGroup = await Group.findOne({
        where: { name: gName, CompanyId: targetCompanyId }
      });

      if (!targetGroup) {
        console.log(`  - Group "${gName}" not found in target company. Creating it...`);
        let nature = ledger.Group?.nature || 'Liabilities';
        let category = ledger.Group?.category || 'Sub-Group';
        
        let parent_id = null;
        let parentName = '';
        if (gName === 'Sundry Creditors' || gName === 'Duties & Taxes') parentName = 'Current Liabilities';
        if (gName === 'Sundry Debtors') parentName = 'Current Assets';
        
        if (parentName) {
          const parentGroup = await Group.findOne({ where: { name: parentName, CompanyId: targetCompanyId } });
          if (parentGroup) parent_id = parentGroup.id;
        }

        targetGroup = await Group.create({
          name: gName,
          nature,
          category,
          parent_id,
          CompanyId: targetCompanyId
        });
        console.log(`  - Created Group "${gName}" (ID: ${targetGroup.id}) in target company.`);
      } else {
        console.log(`  - Found existing Group "${gName}" (ID: ${targetGroup.id}) in target company.`);
      }

      // Update the ledger
      await ledger.update({
        CompanyId: targetCompanyId,
        GroupId: targetGroup.id,
        groupName: gName
      });
      console.log(`  - Ledger updated successfully!`);
    }

    console.log('\n--- Migration / Repair v2 finished successfully! ---');

  } catch (err) {
    console.error('Error during repair:', err);
  } finally {
    await sequelize.close();
  }
}

repair();
