const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Company, Group, Ledger, sequelize } = require('../models');
const AccountingService = require('../services/AccountingService');

async function seedPractice() {
  const companyId = 'eb78e8e7-232d-43a5-be7f-3ea394c946bc'; // Swathi's active company " Sri Murugan Traders"
  
  console.log("Checking company...");
  const company = await Company.findByPk(companyId);
  if (!company) {
    console.error("Company Sri Murugan Traders not found!");
    return;
  }

  // Ensure groups exist
  let gCount = await Group.count({ where: { CompanyId: companyId } });
  if (gCount === 0) {
    console.log("Seeding standard groups...");
    const { standardGroups } = require('../helpers/tallyGroups');
    const primaryGroups = standardGroups.filter(g => !g.parent);
    const groupMap = {};
    for (const g of primaryGroups) {
      const created = await Group.create({
        name: g.name,
        nature: g.nature,
        category: 'Primary',
        CompanyId: companyId
      });
      groupMap[g.name] = created.id;
    }
    const subGroups = standardGroups.filter(g => g.parent);
    for (const g of subGroups) {
      const created = await Group.create({
        name: g.name,
        nature: g.nature,
        category: 'Sub-Group',
        parent_id: groupMap[g.parent] || null,
        CompanyId: companyId
      });
      groupMap[g.name] = created.id;
    }
  }

  // Fetch groups to map names to IDs
  const groups = await Group.findAll({ where: { CompanyId: companyId } });
  const groupMap = {};
  groups.forEach(g => {
    groupMap[g.name] = g.id;
  });

  // Check if ledgers already exist
  const lCount = await Ledger.count({ where: { CompanyId: companyId } });
  if (lCount > 0) {
    console.log("Ledgers already exist for this company. Skipping ledger seeding.");
    return;
  }

  console.log("Seeding practice ledgers...");
  const ledgers = {};
  const ledgerConfigs = [
    { name: 'Cash', group: 'Cash-in-Hand', type: 'Dr' },
    { name: 'State Bank of India', group: 'Bank Accounts', type: 'Dr' },
    { name: 'Capital Account', group: 'Capital Account', type: 'Cr' },
    { name: 'Ravi Electronics', group: 'Sundry Creditors', type: 'Cr' },
    { name: 'Purchase Account', group: 'Purchase Accounts', type: 'Dr' },
    { name: 'GST Input', group: 'Duties & Taxes', type: 'Dr' },
    { name: 'ABC Industries', group: 'Sundry Debtors', type: 'Dr' },
    { name: 'Sales Account', group: 'Sales Accounts', type: 'Cr' },
    { name: 'GST Output', group: 'Duties & Taxes', type: 'Cr' }
  ];

  for (const config of ledgerConfigs) {
    const GroupId = groupMap[config.group];
    if (!GroupId) {
      console.error(`Group not found: ${config.group}`);
      continue;
    }
    ledgers[config.name] = await Ledger.create({
      name: config.name,
      GroupId,
      CompanyId: companyId,
      openingBalance: 0,
      openingBalanceType: config.type,
      currentBalance: 0
    });
  }

  console.log("Posting sample practice transactions...");

  // T1: Owner contributes 5,00,000 cash (Receipt)
  await AccountingService.recordJournalEntry({
    companyId: companyId,
    date: new Date(),
    narration: "Owner Capital Contribution",
    voucherType: 'Receipt',
    entries: [
      { ledgerId: ledgers['Cash'].id, debit: 500000 },
      { ledgerId: ledgers['Capital Account'].id, credit: 500000 }
    ]
  });

  // T2: Deposit 3,00,000 cash to SBI bank (Contra)
  await AccountingService.recordJournalEntry({
    companyId: companyId,
    date: new Date(),
    narration: "Deposit cash to SBI",
    voucherType: 'Contra',
    entries: [
      { ledgerId: ledgers['State Bank of India'].id, debit: 300000 },
      { ledgerId: ledgers['Cash'].id, credit: 300000 }
    ]
  });

  // T3: Purchase goods from Ravi Electronics worth 10,000 + 1,800 GST (Purchase)
  await AccountingService.recordJournalEntry({
    companyId: companyId,
    date: new Date(),
    narration: "Purchase electronics stock from Ravi Electronics",
    voucherType: 'Purchase',
    entries: [
      { ledgerId: ledgers['Purchase Account'].id, debit: 10000 },
      { ledgerId: ledgers['GST Input'].id, debit: 1800 },
      { ledgerId: ledgers['Ravi Electronics'].id, credit: 11800 }
    ]
  });

  // T4: Sell goods to ABC Industries worth 8,000 + 1,440 GST (Sales)
  await AccountingService.recordJournalEntry({
    companyId: companyId,
    date: new Date(),
    narration: "Sales to ABC Industries",
    voucherType: 'Sales',
    entries: [
      { ledgerId: ledgers['ABC Industries'].id, debit: 9440 },
      { ledgerId: ledgers['Sales Account'].id, credit: 8000 },
      { ledgerId: ledgers['GST Output'].id, credit: 1440 }
    ]
  });

  console.log("Practice data seeded successfully!");
}

seedPractice()
  .then(() => {
    sequelize.close();
    process.exit(0);
  })
  .catch(err => {
    console.error("Error seeding practice data:", err);
    sequelize.close();
    process.exit(1);
  });
