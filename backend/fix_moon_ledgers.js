const { Ledger, Group, Company } = require('./models');

async function fixMoonLedgers() {
  const companyId = '5f028981-8de4-4c19-9a90-54257dd87f70';
  
  try {
    // 1. Ensure Groups Exist
    const salesGroup = await Group.findOne({ where: { name: 'Sales Accounts', CompanyId: companyId } });
    const dutyGroup = await Group.findOne({ where: { name: 'Duties & Taxes', CompanyId: companyId } });

    if (!salesGroup || !dutyGroup) {
       console.error('FATAL: Missing Sales or Duty groups. Please seed company groups first.');
       process.exit(1);
    }

    // 2. Create Ledgers
    const ledgersToCreate = [
      { name: 'Sales', GroupId: salesGroup.id, nature: 'Income' },
      { name: 'CGST', GroupId: dutyGroup.id, nature: 'Liabilities' },
      { name: 'SGST', GroupId: dutyGroup.id, nature: 'Liabilities' },
      { name: 'IGST', GroupId: dutyGroup.id, nature: 'Liabilities' }
    ];

    for (const l of ledgersToCreate) {
      const exists = await Ledger.findOne({ where: { name: l.name, CompanyId: companyId } });
      if (!exists) {
        await Ledger.create({
          ...l,
          CompanyId: companyId,
          openingBalance: 0,
          currentBalance: 0
        });
        console.log(`CREATED LEDGER: ${l.name}`);
      } else {
        console.log(`LEDGER EXISTS: ${l.name}`);
      }
    }
    
    console.log('SUCCESS: All required accounting ledgers are now present for The MOON Enterprises.');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

fixMoonLedgers();
