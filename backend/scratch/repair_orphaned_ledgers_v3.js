const { Ledger, Group, sequelize } = require('../models');

async function reclassify() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const companyId = 'eb78e8e7-232d-43a5-be7f-3ea394c946bc'; // Sri Murugan Traders

    const ledgers = await Ledger.findAll({
      where: { CompanyId: companyId }
    });

    console.log(`Analyzing ${ledgers.length} ledgers for Sri Murugan Traders...`);

    for (const ledger of ledgers) {
      let targetGroupName = null;
      const nameLower = ledger.name.toLowerCase();

      if (nameLower === 'cash') {
        targetGroupName = 'Cash-in-Hand';
      } else if (nameLower.includes('bank')) {
        targetGroupName = 'Bank Accounts';
      } else if (nameLower.includes('gst input') || nameLower.includes('gst output')) {
        targetGroupName = 'Duties & Taxes';
      } else if (nameLower === 'purchase account') {
        targetGroupName = 'Purchase Accounts';
      } else if (nameLower === 'sales account') {
        targetGroupName = 'Sales Accounts';
      } else if (nameLower === 'capital account' || nameLower === "owner's equity") {
        targetGroupName = 'Capital Account';
      } else if (nameLower === 'abc industries') {
        targetGroupName = 'Sundry Debtors';
      } else if (nameLower === 'office suppliers') {
        targetGroupName = 'Fixed Assets';
      } else if (['ravi electronics', 'infosys', 'abc traders'].includes(nameLower)) {
        targetGroupName = 'Sundry Creditors';
      }

      if (targetGroupName) {
        console.log(`Ledger: "${ledger.name}" -> target group: "${targetGroupName}"`);
        
        let group = await Group.findOne({
          where: { name: targetGroupName, CompanyId: companyId }
        });

        if (!group) {
          console.log(`  - Group "${targetGroupName}" not found. Creating...`);
          let nature = 'Liabilities';
          let category = 'Primary';
          if (['Bank Accounts', 'Cash-in-Hand', 'Sundry Debtors', 'Fixed Assets'].includes(targetGroupName)) {
            nature = 'Assets';
          }
          if (['Purchase Accounts', 'Direct Expenses', 'Indirect Expenses'].includes(targetGroupName)) {
            nature = 'Expenses';
          }
          if (['Sales Accounts', 'Direct Incomes', 'Indirect Incomes'].includes(targetGroupName)) {
            nature = 'Income';
          }
          if (['Sundry Creditors', 'Sundry Debtors', 'Duties & Taxes'].includes(targetGroupName)) {
            category = 'Sub-Group';
          }

          let parent_id = null;
          let parentName = '';
          if (targetGroupName === 'Sundry Creditors' || targetGroupName === 'Duties & Taxes') parentName = 'Current Liabilities';
          if (targetGroupName === 'Sundry Debtors') parentName = 'Current Assets';
          
          if (parentName) {
            const parentGroup = await Group.findOne({ where: { name: parentName, CompanyId: companyId } });
            if (parentGroup) parent_id = parentGroup.id;
          }

          group = await Group.create({
            name: targetGroupName,
            nature,
            category,
            parent_id,
            CompanyId: companyId
          });
          console.log(`  - Created group "${targetGroupName}" (ID: ${group.id})`);
        }

        await ledger.update({
          GroupId: group.id,
          groupName: targetGroupName
        });
        console.log(`  - Updated successfully.`);
      }
    }

    console.log('\n--- Reclassification finished successfully! ---');

  } catch (err) {
    console.error('Reclassification error:', err);
  } finally {
    await sequelize.close();
  }
}

reclassify();
