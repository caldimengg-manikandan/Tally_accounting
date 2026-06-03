const { Ledger, Group, Company, sequelize } = require('../models');

async function repair() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // 1. Get the primary company
    const companies = await Company.findAll();
    if (companies.length === 0) {
      console.error('No companies exist in the database. Cannot run repair.');
      return;
    }

    // Try to find "Manikandan & Co" first, otherwise default to first company
    let targetCompany = companies.find(c => c.name.toLowerCase().includes('manikandan')) || companies[0];
    console.log(`Using company: "${targetCompany.name}" (ID: ${targetCompany.id}) as the target company for repair.`);

    // 2. Find all ledgers with null CompanyId or null GroupId
    const orphanedLedgers = await Ledger.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { CompanyId: null },
          { GroupId: null }
        ]
      }
    });

    console.log(`Found ${orphanedLedgers.length} orphaned/unlinked ledgers.`);

    for (const ledger of orphanedLedgers) {
      console.log(`\nRepairing Ledger: "${ledger.name}" (ID: ${ledger.id})`);
      
      // Determine target company
      const ledgerCompanyId = ledger.CompanyId || targetCompany.id;
      
      // Determine group name
      let gName = ledger.groupName;
      if (!gName) {
        // Guess groupName based on customerType/fields
        if (ledger.customerType === 'Individual' || ledger.customerType === 'Business') {
          // Check if it's a vendor/supplier by looking at billingAddress or other fields, or guess from name
          // Since it's in vendors list request, default to Sundry Creditors unless specified otherwise
          gName = 'Sundry Creditors';
        } else {
          gName = 'Sundry Creditors';
        }
      }

      console.log(`  - Setting CompanyId: ${ledgerCompanyId}`);
      console.log(`  - Resolving group: "${gName}"`);

      // Find or create group
      let group = await Group.findOne({
        where: { name: gName, CompanyId: ledgerCompanyId }
      });

      if (!group) {
        console.log(`  - Group "${gName}" not found for this company. Creating it...`);
        let nature = 'Liabilities';
        let category = 'Primary';
        if (['Bank Accounts', 'Cash-in-Hand', 'Sundry Debtors'].includes(gName)) {
          nature = 'Assets';
        }
        if (['Sundry Creditors', 'Sundry Debtors', 'Duties & Taxes'].includes(gName)) {
          category = 'Sub-Group';
        }

        let parent_id = null;
        let parentName = '';
        if (gName === 'Sundry Creditors' || gName === 'Duties & Taxes') parentName = 'Current Liabilities';
        if (gName === 'Sundry Debtors') parentName = 'Current Assets';
        
        if (parentName) {
          const parentGroup = await Group.findOne({ where: { name: parentName, CompanyId: ledgerCompanyId } });
          if (parentGroup) parent_id = parentGroup.id;
        }

        group = await Group.create({
          name: gName,
          nature,
          category,
          parent_id,
          CompanyId: ledgerCompanyId
        });
        console.log(`  - Created group "${gName}" (ID: ${group.id})`);
      } else {
        console.log(`  - Found existing group "${gName}" (ID: ${group.id})`);
      }

      // Update the ledger
      await ledger.update({
        CompanyId: ledgerCompanyId,
        GroupId: group.id,
        groupName: gName
      });

      console.log(`  - Successfully updated ledger.`);
    }

    console.log('\n--- Repair process finished successfully! ---');

  } catch (error) {
    console.error('Error during repair:', error);
  } finally {
    await sequelize.close();
  }
}

repair();
