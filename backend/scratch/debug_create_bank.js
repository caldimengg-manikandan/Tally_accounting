const { Ledger, Group, Company } = require('../models');

async function test() {
  try {
    const company = await Company.findOne();
    if (!company) {
       console.log("No company found");
       return;
    }
    console.log("Using company:", company.name, company.id);

    const group = await Group.findOne({ where: { name: 'Bank Accounts', CompanyId: company.id } });
    if (!group) {
        console.log("Group 'Bank Accounts' not found for this company");
    } else {
        console.log("Found group:", group.name, group.id);
    }

    const testLedger = await Ledger.create({
      name: 'Test Bank ' + Date.now(),
      accountNumber: '12345678',
      bankName: 'Test Bank',
      ifsc: 'TEST0001',
      CompanyId: company.id,
      GroupId: group ? group.id : null
    });
    console.log("Successfully created test ledger:", testLedger.id);
  } catch (err) {
    console.error("FAILED to create ledger:", err);
  }
}

test();
