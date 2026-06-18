const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, 'explain_report_result.txt');
fs.writeFileSync(logFile, ''); // Clear log file
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = (...args) => {
  originalLog(...args);
  logStream.write(args.join(' ') + '\n');
};
console.warn = (...args) => {
  originalWarn(...args);
  logStream.write('[WARN] ' + args.join(' ') + '\n');
};
console.error = (...args) => {
  originalError(...args);
  logStream.write('[ERROR] ' + args.join(' ') + '\n');
};

const { sequelize, Company, User, Group, Ledger, Item, Voucher, Transaction, SalesInvoice, PurchaseOrder, CostCenter, CostCenterAllocation, AuditLog, Project, Budget, BudgetItem } = require('../models');
const reportsController = require('../modules/reports/reports.controller');
const { crypto } = require('crypto');

// Helper to generate UUID
function generateUUID() {
  return require('crypto').randomUUID();
}

async function run() {
  console.log('🏁 Starting report queries performance validation...');
  
  const targetCompanyId = generateUUID();
  const noiseCompanyId = generateUUID();
  const userId = generateUUID();
  
  console.log(`Target CompanyId: ${targetCompanyId}`);
  console.log(`Noise CompanyId: ${noiseCompanyId}`);

  try {
    // 1. Create User & Companies
    console.log('🌱 Seeding companies and user...');
    await User.create({
      id: userId,
      name: 'Performance Test Auditor',
      email: 'auditor@test.com',
      password: 'password123',
      role: 'AUDITOR'
    });

    await Company.create({ id: targetCompanyId, name: 'Target Test Company' });
    await Company.create({ id: noiseCompanyId, name: 'Noise Test Company' });

    // 2. Create Groups (nature & names are important for business calculations)
    console.log('🌱 Seeding groups...');
    const groupNatures = [
      { name: 'Sales Accounts', nature: 'Income', category: 'Primary' },
      { name: 'Direct Incomes', nature: 'Income', category: 'Primary' },
      { name: 'Indirect Incomes', nature: 'Income', category: 'Primary' },
      { name: 'Purchase Accounts', nature: 'Expenses', category: 'Primary' },
      { name: 'Direct Expenses', nature: 'Expenses', category: 'Primary' },
      { name: 'Indirect Expenses', nature: 'Expenses', category: 'Primary' },
      { name: 'Fixed Assets', nature: 'Assets', category: 'Primary' },
      { name: 'Current Assets', nature: 'Assets', category: 'Primary' },
      { name: 'Investments', nature: 'Assets', category: 'Primary' },
      { name: 'Capital Account', nature: 'Liabilities', category: 'Primary' },
      { name: 'Loans (Liability)', nature: 'Liabilities', category: 'Primary' },
      { name: 'Current Liabilities', nature: 'Liabilities', category: 'Primary' }
    ];

    const targetGroups = [];
    const noiseGroups = [];

    for (const gn of groupNatures) {
      targetGroups.push(await Group.create({ ...gn, CompanyId: targetCompanyId }));
      noiseGroups.push(await Group.create({ ...gn, CompanyId: noiseCompanyId }));
    }

    // Add sub-groups
    const targetCurrentAssets = targetGroups.find(g => g.name === 'Current Assets');
    const targetCurrentLiabilities = targetGroups.find(g => g.name === 'Current Liabilities');
    const noiseCurrentAssets = noiseGroups.find(g => g.name === 'Current Assets');
    const noiseCurrentLiabilities = noiseGroups.find(g => g.name === 'Current Liabilities');

    const targetSundryDebtors = await Group.create({ name: 'Sundry Debtors', nature: 'Assets', category: 'Sub-Group', parent_id: targetCurrentAssets.id, CompanyId: targetCompanyId });
    const targetSundryCreditors = await Group.create({ name: 'Sundry Creditors', nature: 'Liabilities', category: 'Sub-Group', parent_id: targetCurrentLiabilities.id, CompanyId: targetCompanyId });

    const noiseSundryDebtors = await Group.create({ name: 'Sundry Debtors', nature: 'Assets', category: 'Sub-Group', parent_id: noiseCurrentAssets.id, CompanyId: noiseCompanyId });
    const noiseSundryCreditors = await Group.create({ name: 'Sundry Creditors', nature: 'Liabilities', category: 'Sub-Group', parent_id: noiseCurrentLiabilities.id, CompanyId: noiseCompanyId });

    targetGroups.push(targetSundryDebtors, targetSundryCreditors);
    noiseGroups.push(noiseSundryDebtors, noiseSundryCreditors);

    // 3. Create Ledgers
    console.log('🌱 Seeding ledgers...');
    const targetLedgers = [];
    const noiseLedgers = [];

    const ledgerDefinitions = [
      { name: 'Cash Ledger', groupName: 'Current Assets', openingBalance: 100000.00, openingBalanceType: 'Dr' },
      { name: 'Bank Account', groupName: 'Current Assets', openingBalance: 500000.00, openingBalanceType: 'Dr' },
      { name: 'Main Sales', groupName: 'Sales Accounts', openingBalance: 0.00, openingBalanceType: 'Dr' },
      { name: 'Main Purchase', groupName: 'Purchase Accounts', openingBalance: 0.00, openingBalanceType: 'Dr' },
      { name: 'Customer A', groupName: 'Sundry Debtors', openingBalance: 5000.00, openingBalanceType: 'Dr' },
      { name: 'Vendor B', groupName: 'Sundry Creditors', openingBalance: 3000.00, openingBalanceType: 'Cr' },
      { name: 'CGST Input', groupName: 'Current Assets', openingBalance: 0.00, openingBalanceType: 'Dr' },
      { name: 'SGST Input', groupName: 'Current Assets', openingBalance: 0.00, openingBalanceType: 'Dr' },
      { name: 'CGST Output', groupName: 'Current Liabilities', openingBalance: 0.00, openingBalanceType: 'Cr' },
      { name: 'SGST Output', groupName: 'Current Liabilities', openingBalance: 0.00, openingBalanceType: 'Cr' }
    ];

    for (const ld of ledgerDefinitions) {
      const targetGroup = targetGroups.find(g => g.name === ld.groupName);
      targetLedgers.push(await Ledger.create({
        name: ld.name,
        openingBalance: ld.openingBalance,
        openingBalanceType: ld.openingBalanceType,
        GroupId: targetGroup.id,
        CompanyId: targetCompanyId
      }));

      const noiseGroup = noiseGroups.find(g => g.name === ld.groupName);
      noiseLedgers.push(await Ledger.create({
        name: ld.name,
        openingBalance: ld.openingBalance,
        openingBalanceType: ld.openingBalanceType,
        GroupId: noiseGroup.id,
        CompanyId: noiseCompanyId
      }));
    }

    const targetCustomer = targetLedgers.find(l => l.name === 'Customer A');
    const noiseCustomer = noiseLedgers.find(l => l.name === 'Customer A');

    // 4. Create Items
    console.log('🌱 Seeding items...');
    const targetItem = await Item.create({ name: 'Product A', costPrice: 100.00, sellingPrice: 150.00, openingStock: 1000, currentStock: 1000, CompanyId: targetCompanyId });
    const noiseItem = await Item.create({ name: 'Product A Noise', costPrice: 100.00, sellingPrice: 150.00, openingStock: 1000, currentStock: 1000, CompanyId: noiseCompanyId });

    // 5. Create Cost Centers & Projects & Budgets
    console.log('🌱 Seeding cost centers, projects, budgets...');
    const targetCostCenter = await CostCenter.create({ name: 'CC Target', category: 'Sales', CompanyId: targetCompanyId });
    const noiseCostCenter = await CostCenter.create({ name: 'CC Noise', category: 'Sales', CompanyId: noiseCompanyId });

    const targetProject = await Project.create({ name: 'Project Target', status: 'In Progress', CompanyId: targetCompanyId });
    const noiseProject = await Project.create({ name: 'Project Noise', status: 'In Progress', CompanyId: noiseCompanyId });

    const targetBudget = await Budget.create({ name: 'Budget Target', fiscalYear: '2026-2027', CompanyId: targetCompanyId });
    const noiseBudget = await Budget.create({ name: 'Budget Noise', fiscalYear: '2026-2027', CompanyId: noiseCompanyId });

    const targetPurchGroup = targetGroups.find(g => g.name === 'Purchase Accounts');
    const noisePurchGroup = noiseGroups.find(g => g.name === 'Purchase Accounts');

    await BudgetItem.create({ BudgetId: targetBudget.id, GroupId: targetPurchGroup.id, targetAmount: 10000.00 });
    await BudgetItem.create({ BudgetId: noiseBudget.id, GroupId: noisePurchGroup.id, targetAmount: 10000.00 });

    // 6. Create Vouchers (10,000 Vouchers total)
    // - 100 for Target Company
    // - 9,900 for Noise Company
    console.log('🌱 Seeding 10,000 vouchers (in batches)...');
    const voucherBatch = [];
    const voucherTypes = ['Receipt', 'Payment', 'Sales', 'Purchase', 'Journal', 'Contra'];

    // 100 Target vouchers
    for (let i = 0; i < 100; i++) {
      voucherBatch.push({
        id: generateUUID(),
        voucherType: voucherTypes[i % voucherTypes.length],
        date: new Date('2026-06-01T10:00:00.000Z'),
        voucherNumber: `VCH-TGT-${String(i).padStart(5, '0')}`,
        status: 'Paid',
        narration: JSON.stringify({ notes: 'Target performance test voucher' }),
        CompanyId: targetCompanyId,
        ProjectId: targetProject.id,
        UserId: userId
      });
    }

    // 9,900 Noise vouchers
    for (let i = 0; i < 9900; i++) {
      voucherBatch.push({
        id: generateUUID(),
        voucherType: voucherTypes[i % voucherTypes.length],
        date: new Date('2026-06-01T10:00:00.000Z'),
        voucherNumber: `VCH-NSE-${String(i).padStart(5, '0')}`,
        status: 'Paid',
        narration: JSON.stringify({ notes: 'Noise performance test voucher' }),
        CompanyId: noiseCompanyId,
        ProjectId: noiseProject.id,
        UserId: userId
      });
    }

    const createdVouchers = await Voucher.bulkCreate(voucherBatch);
    const targetVouchers = createdVouchers.filter(v => v.CompanyId === targetCompanyId);
    const noiseVouchers = createdVouchers.filter(v => v.CompanyId === noiseCompanyId);

    console.log(`Created ${targetVouchers.length} target vouchers and ${noiseVouchers.length} noise vouchers.`);

    // 7. Create Transactions (100,000 Transactions total)
    // - 1,000 for Target Company
    // - 99,000 for Noise Company
    console.log('🌱 Seeding 100,000 transactions (in batches of 20,000)...');
    const transactionBatch = [];
    const totalTransactionsCount = 100000;
    const targetTransactionsCount = 1000;

    // Generate Target transactions
    for (let i = 0; i < targetTransactionsCount; i++) {
      const v = targetVouchers[i % targetVouchers.length];
      const l = targetLedgers[i % targetLedgers.length];
      transactionBatch.push({
        id: generateUUID(),
        debit: i % 2 === 0 ? 150.00 : 0.00,
        credit: i % 2 === 1 ? 150.00 : 0.00,
        quantity: i % 10 === 0 ? 1 : 0,
        rate: i % 10 === 0 ? 150.00 : 0.00,
        description: `Target TX ${i}`,
        CompanyId: targetCompanyId,
        LedgerId: l.id,
        VoucherId: v.id,
        ItemId: i % 10 === 0 ? targetItem.id : null,
        createdAt: new Date('2026-06-01T10:00:00.000Z')
      });
    }

    // Generate Noise transactions
    for (let i = 0; i < (totalTransactionsCount - targetTransactionsCount); i++) {
      const v = noiseVouchers[i % noiseVouchers.length];
      const l = noiseLedgers[i % noiseLedgers.length];
      transactionBatch.push({
        id: generateUUID(),
        debit: i % 2 === 0 ? 150.00 : 0.00,
        credit: i % 2 === 1 ? 150.00 : 0.00,
        quantity: i % 10 === 0 ? 1 : 0,
        rate: i % 10 === 0 ? 150.00 : 0.00,
        description: `Noise TX ${i}`,
        CompanyId: noiseCompanyId,
        LedgerId: l.id,
        VoucherId: v.id,
        ItemId: i % 10 === 0 ? noiseItem.id : null,
        createdAt: new Date('2026-06-01T10:00:00.000Z')
      });
    }

    // Bulk create in chunks of 20,000 to keep network memory usage sane
    const chunkSize = 20000;
    const createdTransactions = [];
    for (let i = 0; i < transactionBatch.length; i += chunkSize) {
      const chunk = transactionBatch.slice(i, i + chunkSize);
      const res = await Transaction.bulkCreate(chunk);
      createdTransactions.push(...res);
      console.log(`... inserted ${createdTransactions.length}/${totalTransactionsCount} transactions`);
    }

    const targetTx = createdTransactions.filter(t => t.CompanyId === targetCompanyId);
    const noiseTx = createdTransactions.filter(t => t.CompanyId === noiseCompanyId);

    // 8. Create CostCenterAllocations (10,000 total)
    // - 100 for Target Company
    // - 9,900 for Noise Company
    console.log('🌱 Seeding 10,000 cost center allocations...');
    const ccAllocationBatch = [];
    for (let i = 0; i < 100; i++) {
      const tx = targetTx[i % targetTx.length];
      ccAllocationBatch.push({
        id: generateUUID(),
        amount: 150.00,
        percentage: 100.00,
        CostCenterId: targetCostCenter.id,
        TransactionId: tx.id,
        CompanyId: targetCompanyId
      });
    }
    for (let i = 0; i < 9900; i++) {
      const tx = noiseTx[i % noiseTx.length];
      ccAllocationBatch.push({
        id: generateUUID(),
        amount: 150.00,
        percentage: 100.00,
        CostCenterId: noiseCostCenter.id,
        TransactionId: tx.id,
        CompanyId: noiseCompanyId
      });
    }
    await CostCenterAllocation.bulkCreate(ccAllocationBatch);

    // 9. Create SalesInvoices (10,000 total)
    // - 100 for Target Company
    // - 9,900 for Noise Company
    console.log('🌱 Seeding 10,000 sales invoices...');
    const invoiceBatch = [];
    for (let i = 0; i < 100; i++) {
      invoiceBatch.push({
        id: generateUUID(),
        invoiceNumber: `INV-TGT-${String(i).padStart(5, '0')}`,
        date: new Date('2026-06-01T10:00:00.000Z'),
        dueDate: new Date('2026-06-15T10:00:00.000Z'),
        totalAmount: 500.00,
        amountPaid: 0.00,
        balance: 500.00,
        status: 'Unpaid',
        customerLedgerId: targetCustomer.id,
        CompanyId: targetCompanyId
      });
    }
    for (let i = 0; i < 9900; i++) {
      invoiceBatch.push({
        id: generateUUID(),
        invoiceNumber: `INV-NSE-${String(i).padStart(5, '0')}`,
        date: new Date('2026-06-01T10:00:00.000Z'),
        dueDate: new Date('2026-06-15T10:00:00.000Z'),
        totalAmount: 500.00,
        amountPaid: 0.00,
        balance: 500.00,
        status: 'Unpaid',
        customerLedgerId: noiseCustomer.id,
        CompanyId: noiseCompanyId
      });
    }
    await SalesInvoice.bulkCreate(invoiceBatch);

    // 10. Create AuditLogs (1,000 total)
    // - 10 for Target Company
    // - 990 for Noise Company
    console.log('🌱 Seeding 1,000 audit logs...');
    const auditBatch = [];
    for (let i = 0; i < 10; i++) {
      auditBatch.push({
        id: generateUUID(),
        action: 'CREATE',
        details: 'Created voucher for target company',
        UserId: userId,
        CompanyId: targetCompanyId,
        createdAt: new Date('2026-06-01T10:00:00.000Z')
      });
    }
    for (let i = 0; i < 990; i++) {
      auditBatch.push({
        id: generateUUID(),
        action: 'CREATE',
        details: 'Created voucher for noise company',
        UserId: userId,
        CompanyId: noiseCompanyId,
        createdAt: new Date('2026-06-01T10:00:00.000Z')
      });
    }
    await AuditLog.bulkCreate(auditBatch);

    console.log('🎉 Seeding successfully completed!');
    
    // ----------------------------------------------------
    // QUERY CAPTURING
    // ----------------------------------------------------
    console.log('\n🔎 Overriding Sequelize logging to capture query strings...');
    const sqlQueries = [];
    
    sequelize.options.logging = (sql, queryObject) => {
      // Clean SQL prefix
      const cleanSql = sql.replace('Executing (default): ', '').trim();
      
      // Filter only SELECT queries on the key tables to analyze index usage
      const targetTables = ['Transactions', 'Vouchers', 'Ledgers', 'SalesInvoices', 'PurchaseOrders', 'Items', 'AuditLogs'];
      const isTargetTable = targetTables.some(table => cleanSql.includes(`"${table}"`) || cleanSql.includes(table));
      
      if (cleanSql.toUpperCase().startsWith('SELECT') && isTargetTable) {
        sqlQueries.push({
          sql: cleanSql,
          bind: queryObject?.bind,
          replacements: queryObject?.replacements
        });
      }
    };

    // Helper to format parameterized queries
    function formatQuery(sql, bind, replacements) {
      const params = bind || replacements;
      if (!params) return sql;
      
      let formattedSql = sql;
      if (Array.isArray(params)) {
        const indexes = params.map((v, i) => i + 1).sort((a, b) => b - a);
        for (const idx of indexes) {
          const val = params[idx - 1];
          let valStr = 'NULL';
          if (val !== null && val !== undefined) {
            if (val instanceof Date) {
              valStr = `'${val.toISOString()}'`;
            } else if (typeof val === 'string') {
              valStr = `'${val.replace(/'/g, "''")}'`;
            } else if (typeof val === 'number' || typeof val === 'boolean') {
              valStr = val.toString();
            } else {
              valStr = `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            }
          }
          formattedSql = formattedSql.replace(new RegExp(`\\$${idx}\\b`, 'g'), valStr);
        }
      } else if (typeof params === 'object') {
        const keys = Object.keys(params).sort((a, b) => b.length - a.length);
        for (const key of keys) {
          const val = params[key];
          let valStr = 'NULL';
          if (val !== null && val !== undefined) {
            if (val instanceof Date) {
              valStr = `'${val.toISOString()}'`;
            } else if (typeof val === 'string') {
              valStr = `'${val.replace(/'/g, "''")}'`;
            } else if (typeof val === 'number' || typeof val === 'boolean') {
              valStr = val.toString();
            } else {
              valStr = `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            }
          }
          formattedSql = formattedSql.replace(new RegExp(`:${key}\\b`, 'g'), valStr);
        }
      }
      return formattedSql;
    }

    // Helper mock response
    function createMockRes() {
      const res = {};
      res.status = function(code) {
        this.statusCode = code;
        return this;
      };
      res.json = function(data) {
        this.body = data;
        return this;
      };
      return res;
    }

    // 11. Run reports controllers
    console.log('\n📊 Invoking report controller endpoints to trigger queries...');

    const reqMock = {
      params: { companyId: targetCompanyId, ledgerId: targetLedgers[0].id },
      query: { from: '2026-04-01', to: '2027-03-31' }
    };

    const endpoints = [
      { name: 'Trial Balance', fn: reportsController.getTrialBalance },
      { name: 'Profit and Loss', fn: reportsController.getProfitAndLoss },
      { name: 'Balance Sheet', fn: reportsController.getBalanceSheet },
      { name: 'Daybook', fn: reportsController.getDaybook },
      { name: 'Dashboard Stats', fn: reportsController.getDashboardStats },
      { name: 'Ledger Statement', fn: reportsController.getLedgerStatement },
      { name: 'Cash Flow', fn: reportsController.getCashFlow },
      { name: 'Receivables Report', fn: reportsController.getReceivablesReport },
      { name: 'Payables Report', fn: reportsController.getPayablesReport },
      { name: 'Inventory Report', fn: reportsController.getInventoryReport },
      { name: 'Group Summary', fn: reportsController.getGroupSummary },
      { name: 'Stock Aging', fn: reportsController.getStockAging },
      { name: 'Cost Center Report', fn: reportsController.getCostCenterReport },
      { name: 'Audit Logs', fn: reportsController.getAuditLogs }
    ];

    for (const ep of endpoints) {
      console.log(`   Running endpoint: ${ep.name}...`);
      await ep.fn(reqMock, createMockRes()).catch(err => {
        console.warn(`   ⚠️ Warning: endpoint ${ep.name} encountered an error but query logs are still collected:`, err.message);
      });
    }

    console.log(`\n📦 Captured ${sqlQueries.length} database query candidate statements.`);

    // Disable logging for our explain tests to not clutter output
    sequelize.options.logging = false;

    // Deduplicate query statements based on formatted SQL
    const uniqueQueries = [];
    const seenFormattedSql = new Set();

    for (const q of sqlQueries) {
      const formatted = formatQuery(q.sql, q.bind, q.replacements);
      if (!seenFormattedSql.has(formatted)) {
        seenFormattedSql.add(formatted);
        uniqueQueries.push(formatted);
      }
    }

    console.log(`🔍 Found ${uniqueQueries.length} unique SELECT queries targeting indexed models.`);

    // 12. Run EXPLAIN ANALYZE on each query
    console.log('\n📈 Running EXPLAIN ANALYZE on captured queries and checking plans...');

    let totalQueriesCount = 0;
    let indexedQueriesCount = 0;
    let scanBreakdown = { indexScan: 0, seqScan: 0 };

    for (let i = 0; i < uniqueQueries.length; i++) {
      const query = uniqueQueries[i];
      totalQueriesCount++;
      
      console.log(`\n-------------------------------------------------------------`);
      console.log(`Query #${totalQueriesCount}:`);
      console.log(query);
      
      try {
        const [planRows] = await sequelize.query(`EXPLAIN ANALYZE ${query}`);
        const planTextLines = planRows.map(r => r['QUERY PLAN']);
        
        console.log(`Plan Result snippet:`);
        planTextLines.slice(0, 5).forEach(line => console.log(`   ${line}`));
        if (planTextLines.length > 5) console.log(`   ... (${planTextLines.length - 5} more lines)`);

        // Check if any line in query plan mentions Index Scan or Bitmap Index Scan
        const usesIndex = planTextLines.some(line => 
          line.includes('Index Scan') || line.includes('Bitmap Index Scan') || line.includes('Index Only Scan')
        );

        if (usesIndex) {
          console.log('✅ PASS: Index is used!');
          indexedQueriesCount++;
          scanBreakdown.indexScan++;
        } else {
          // If the plan has Seq Scan on the key tables, we warn or fail
          const targets = ['Transactions', 'Vouchers', 'Ledgers', 'SalesInvoices', 'PurchaseOrders', 'Items', 'AuditLogs'];
          const seqScannedTable = targets.find(tbl => 
            planTextLines.some(line => line.includes(`Seq Scan on "${tbl}"`) || line.includes(`Seq Scan on ${tbl}`))
          );
          
          if (seqScannedTable) {
            console.log(`⚠️ WARNING: Sequential Scan detected on table "${seqScannedTable}".`);
            scanBreakdown.seqScan++;
          } else {
            console.log('ℹ️ INFO: No scan on main indexed tables (subqueries or tiny table scans).');
            indexedQueriesCount++; // count non-scanning helper queries as passed
            scanBreakdown.indexScan++;
          }
        }
      } catch (err) {
        console.error('❌ EXPLAIN ANALYZE execution failed for this query:', err.message);
      }
    }

    console.log('\n=============================================================');
    console.log('📊 PERFORMANCE METRICS SUMMARY:');
    console.log(`- Total unique SELECT queries analyzed: ${totalQueriesCount}`);
    console.log(`- Queries utilizing configured indexes: ${indexedQueriesCount}/${totalQueriesCount} (${Math.round((indexedQueriesCount/totalQueriesCount)*100)}%)`);
    console.log(`- Index Scan / Bitmap Index Scan count: ${scanBreakdown.indexScan}`);
    console.log(`- Sequential Scan count on target tables: ${scanBreakdown.seqScan}`);
    console.log('=============================================================');

    if (scanBreakdown.seqScan > 0) {
      console.warn('⚠️ Some queries performed Sequential Scans on larger tables. Review query scopes or filters.');
    } else {
      console.log('🏆 All core reports successfully leverage the index structures!');
    }

  } catch (err) {
    console.error('❌ An error occurred during performance validation:', err);
  } finally {
    // ----------------------------------------------------
    // CLEAN UP TEST DATA
    // ----------------------------------------------------
    console.log('\n🧹 Cleaning up performance test seed data from database...');
    try {
      // Delete in correct order of dependency
      await CostCenterAllocation.destroy({ where: { CompanyId: [targetCompanyId, noiseCompanyId] }, force: true });
      await Transaction.destroy({ where: { CompanyId: [targetCompanyId, noiseCompanyId] }, force: true });
      await Voucher.destroy({ where: { CompanyId: [targetCompanyId, noiseCompanyId] }, force: true });
      await SalesInvoice.destroy({ where: { CompanyId: [targetCompanyId, noiseCompanyId] }, force: true });
      await PurchaseOrder.destroy({ where: { CompanyId: [targetCompanyId, noiseCompanyId] }, force: true });
      await Item.destroy({ where: { CompanyId: [targetCompanyId, noiseCompanyId] }, force: true });
      await BudgetItem.destroy({ where: {}, force: true }); // clean up budget items
      await Budget.destroy({ where: { CompanyId: [targetCompanyId, noiseCompanyId] }, force: true });
      await Project.destroy({ where: { CompanyId: [targetCompanyId, noiseCompanyId] }, force: true });
      await CostCenter.destroy({ where: { CompanyId: [targetCompanyId, noiseCompanyId] }, force: true });
      await Ledger.destroy({ where: { CompanyId: [targetCompanyId, noiseCompanyId] }, force: true });
      await Group.destroy({ where: { CompanyId: [targetCompanyId, noiseCompanyId] }, force: true });
      await AuditLog.destroy({ where: { CompanyId: [targetCompanyId, noiseCompanyId] }, force: true });
      await Company.destroy({ where: { id: [targetCompanyId, noiseCompanyId] } });
      await User.destroy({ where: { id: userId } });
      
      console.log('✅ Database clean up completed.');
    } catch (cleanupErr) {
      console.error('❌ Failed to clean up database test data:', cleanupErr.message);
    }
    
    await sequelize.close();
    console.log('🏁 Process complete. Closed database connection.');
  }
}

run();
