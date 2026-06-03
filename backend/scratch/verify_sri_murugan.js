const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Company, Group, Ledger, Voucher, Transaction, sequelize } = require('../models');
const { getTrialBalance, getProfitAndLoss, getBalanceSheet, getDashboardStats } = require('../modules/reports/reports.controller');
const { getGSTR3B } = require('../modules/tax/gst.controller');
const AccountingService = require('../services/AccountingService');

async function runVerification() {
  console.log("=== Sri Murugan Traders Test Scenario Verification ===");
  
  // Clean up any existing verification company
  const oldCompany = await Company.findOne({ where: { name: 'Sri Murugan Traders Verification' } });
  if (oldCompany) {
    console.log("Cleaning up old verification company...");
    // Force delete to clear cascade
    await oldCompany.destroy();
  }

  // 1. Create company "Sri Murugan Traders Verification"
  console.log("Creating new company...");
  const company = await Company.create({
    name: "Sri Murugan Traders Verification",
    baseCurrency: 'INR',
    reportBasis: 'Accrual',
    state: 'Tamil Nadu',
    financialYearStart: new Date().getFullYear() + '-04-01',
    booksBeginningFrom: new Date().getFullYear() + '-04-01'
  });

  // Auto-seed Tally standard groups for the newly created company (same as company.controller.js)
  const { standardGroups } = require('../helpers/tallyGroups');
  const primaryGroups = standardGroups.filter(g => !g.parent);
  const groupMap = {};
  for (const g of primaryGroups) {
    const created = await Group.create({
      name: g.name,
      nature: g.nature,
      category: 'Primary',
      CompanyId: company.id
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
      CompanyId: company.id
    });
    groupMap[g.name] = created.id;
  }

  console.log("Groups seeded. Creating ledgers...");

  // 2. Create Ledgers
  const ledgers = {};
  const ledgerConfigs = [
    { name: 'Cash', group: 'Cash-in-Hand', type: 'Dr' },
    { name: 'Indian Bank', group: 'Bank Accounts', type: 'Dr' },
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
      throw new Error(`Group not found: ${config.group}`);
    }
    ledgers[config.name] = await Ledger.create({
      name: config.name,
      GroupId,
      CompanyId: company.id,
      openingBalance: 0,
      openingBalanceType: config.type,
      currentBalance: 0
    });
  }

  console.log("Ledgers created. Posting 6 transactions...");

  // 3. Post transactions
  // T1: Owner starts business with 5,00,000 cash (Receipt)
  await AccountingService.recordJournalEntry({
    companyId: company.id,
    date: new Date(),
    narration: "Owner Capital Contribution",
    voucherType: 'Receipt',
    entries: [
      { ledgerId: ledgers['Cash'].id, debit: 500000 },
      { ledgerId: ledgers['Capital Account'].id, credit: 500000 }
    ]
  });

  // T2: Opens bank account, deposits 3,00,000 cash (Contra)
  await AccountingService.recordJournalEntry({
    companyId: company.id,
    date: new Date(),
    narration: "Deposit cash to bank",
    voucherType: 'Contra',
    entries: [
      { ledgerId: ledgers['Indian Bank'].id, debit: 300000 },
      { ledgerId: ledgers['Cash'].id, credit: 300000 }
    ]
  });

  // T3: Purchase 10,000 + 1,800 GST from Ravi Electronics (Purchase)
  await AccountingService.recordJournalEntry({
    companyId: company.id,
    date: new Date(),
    narration: "Purchase from supplier",
    voucherType: 'Purchase',
    entries: [
      { ledgerId: ledgers['Purchase Account'].id, debit: 10000 },
      { ledgerId: ledgers['GST Input'].id, debit: 1800 },
      { ledgerId: ledgers['Ravi Electronics'].id, credit: 11800 }
    ]
  });

  // T4: Sales to ABC Industries 8,000 + 1,440 GST (Sales)
  await AccountingService.recordJournalEntry({
    companyId: company.id,
    date: new Date(),
    narration: "Sales to customer",
    voucherType: 'Sales',
    entries: [
      { ledgerId: ledgers['ABC Industries'].id, debit: 9440 },
      { ledgerId: ledgers['Sales Account'].id, credit: 8000 },
      { ledgerId: ledgers['GST Output'].id, credit: 1440 }
    ]
  });

  // T5: Payment to Ravi Electronics 11,800 (Payment)
  await AccountingService.recordJournalEntry({
    companyId: company.id,
    date: new Date(),
    narration: "Supplier payment",
    voucherType: 'Payment',
    entries: [
      { ledgerId: ledgers['Ravi Electronics'].id, debit: 11800 },
      { ledgerId: ledgers['Indian Bank'].id, credit: 11800 }
    ]
  });

  // T6: Receipt from ABC Industries 9,440 (Receipt)
  await AccountingService.recordJournalEntry({
    companyId: company.id,
    date: new Date(),
    narration: "Customer payment received",
    voucherType: 'Receipt',
    entries: [
      { ledgerId: ledgers['Indian Bank'].id, debit: 9440 },
      { ledgerId: ledgers['ABC Industries'].id, credit: 9440 }
    ]
  });

  console.log("All transactions posted. Verifying reports...");

  // Mock Request/Response helpers
  const mockReq = { params: { companyId: company.id }, query: {} };
  const getMockRes = (resolve, reject) => ({
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      resolve({ status: this.statusCode || 200, data });
    }
  });

  // 4. Verify Trial Balance
  const trialBalanceResult = await new Promise((resolve, reject) => {
    getTrialBalance(mockReq, getMockRes(resolve, reject));
  });

  console.log("\n=== TRIAL BALANCE ===");
  console.log(JSON.stringify(trialBalanceResult.data.summary, null, 2));
  trialBalanceResult.data.trialBalance.forEach(tb => {
    console.log(`- ${tb.ledgerName} (${tb.group}): Debit Bal: ${tb.debitBalance}, Credit Bal: ${tb.creditBalance}`);
  });

  // Check Trial Balance matches: Debit = Credit = 5,09,440
  const tbSummary = trialBalanceResult.data.summary;
  if (!tbSummary.isBalanced || Math.abs(tbSummary.totalDebit - 509440) > 0.01 || Math.abs(tbSummary.totalCredit - 509440) > 0.01) {
    throw new Error(`FAIL: Trial Balance discrepancy. Expected 5,09,440, got Debit: ${tbSummary.totalDebit}, Credit: ${tbSummary.totalCredit}`);
  }
  console.log("✅ Trial Balance verified successfully!");

  // 5. Verify Profit & Loss
  const plResult = await new Promise((resolve, reject) => {
    getProfitAndLoss(mockReq, getMockRes(resolve, reject));
  });

  console.log("\n=== PROFIT & LOSS ===");
  console.log(`Total Income: ${plResult.data.totalIncome}`);
  console.log(`Total Expenses: ${plResult.data.totalExpenses}`);
  console.log(`Net Profit/Loss: ${plResult.data.netProfit}`);

  // Check Net Loss = -2,000
  if (plResult.data.netProfit !== -2000) {
    throw new Error(`FAIL: Expected Net Loss of -2000, got ${plResult.data.netProfit}`);
  }
  console.log("✅ Profit & Loss verified successfully!");

  // 6. Verify Balance Sheet
  const bsResult = await new Promise((resolve, reject) => {
    getBalanceSheet(mockReq, getMockRes(resolve, reject));
  });

  console.log("\n=== BALANCE SHEET ===");
  console.log(`Total Assets: ${bsResult.data.totalAssets}`);
  console.log(`Total Liabilities: ${bsResult.data.totalLiabilities}`);
  console.log(`isBalanced: ${bsResult.data.isBalanced}`);

  // Check Balance Sheet matches
  if (!bsResult.data.isBalanced) {
    throw new Error(`FAIL: Balance Sheet is not balanced. Assets: ${bsResult.data.totalAssets}, Liabilities: ${bsResult.data.totalLiabilities}`);
  }
  console.log("✅ Balance Sheet verified successfully!");

  // 7. Verify GST Returns
  const gstResult = await new Promise((resolve, reject) => {
    getGSTR3B(mockReq, getMockRes(resolve, reject));
  });

  console.log("\n=== GSTR-3B ===");
  console.log(JSON.stringify(gstResult.data, null, 2));

  // Expected output = 1440, input = 1800, net = 0
  if (gstResult.data.outputTax.total !== 1440 || gstResult.data.inputTaxCredit.total !== 1800 || gstResult.data.netPayable !== 0) {
    throw new Error(`FAIL: GST returns incorrect. Expected output 1440, input 1800, netPayable 0. Got: ${JSON.stringify(gstResult.data)}`);
  }
  console.log("✅ GSTR-3B verified successfully!");

  // 8. Verify Dashboard Stats
  const dashboardResult = await new Promise((resolve, reject) => {
    getDashboardStats(mockReq, getMockRes(resolve, reject));
  });

  console.log("\n=== DASHBOARD ===");
  console.log(`Cash Balance: ${dashboardResult.data.cashBalance}`);
  console.log(`GST Payable: ${dashboardResult.data.gst?.payable}`);
  console.log(`GST Receivable: ${dashboardResult.data.gst?.receivable}`);

  if (dashboardResult.data.gst?.payable !== 1440 || dashboardResult.data.gst?.receivable !== 1800) {
    throw new Error(`FAIL: Dashboard GST stats incorrect. Expected payable 1440, receivable 1800. Got: ${JSON.stringify(dashboardResult.data.gst)}`);
  }

  // Expected Cash = 2,00,000 + 2,97,640 = 4,97,640
  if (dashboardResult.data.cashBalance !== 497640) {
    throw new Error(`FAIL: Dashboard Cash Balance incorrect. Expected 4,97,640, got ${dashboardResult.data.cashBalance}`);
  }
  console.log("✅ Dashboard Stats verified successfully!");

  // Clean up
  console.log("\nCleaning up verification company...");
  await company.destroy();
  console.log("=== ALL VERIFICATIONS PASSED SUCCESSFULLY! ===");
}

runVerification()
  .then(() => {
    sequelize.close();
    process.exit(0);
  })
  .catch(err => {
    console.error("\n❌ VERIFICATION FAILED:", err);
    sequelize.close();
    process.exit(1);
  });
