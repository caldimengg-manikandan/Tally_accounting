const { sequelize, Voucher, Ledger, Transaction, PeriodLock, Company, User } = require('../models');
const AccountingService = require('../services/AccountingService');
const assert = require('assert');

async function runTests() {
  console.log('--- STARTING ACCOUNTING ENGINE INTEGRATION TEST ---');
  let t;
  try {
    await sequelize.authenticate();

    const testEmail = `test_accounting_${Date.now()}@example.com`;

    // 1. Setup Data
    const user = await User.create({ email: testEmail, name: 'Acc Test User', password: 'pwd', role: 'ADMIN' });
    const company = await Company.create({ 
      name: 'Acc Test Company', 
      userId: user.id,
      financialYearStart: new Date('2024-04-01'),
      financialYearEnd: new Date('2025-03-31'),
      booksBeginningFrom: new Date('2024-04-01')
    });

    
    const cashLedger = await Ledger.create({ name: 'Cash', CompanyId: company.id, openingBalanceType: 'Dr', currentBalance: 0 });
    const salesLedger = await Ledger.create({ name: 'Sales', CompanyId: company.id, openingBalanceType: 'Cr', currentBalance: 0 });

    t = await sequelize.transaction();
    // 2. Test Balanced Entry (Success)
    console.log('Test 1: Balanced Journal Entry');
    const voucher1 = await AccountingService.recordJournalEntry({
      companyId: company.id,
      date: new Date(),
      narration: 'Test Sales',
      voucherType: 'Journal',
      userId: user.id,
      entries: [
        { ledgerId: cashLedger.id, debit: 1000, credit: 0 },
        { ledgerId: salesLedger.id, debit: 0, credit: 1000 }
      ]
    }, t);

    assert.ok(voucher1.id, 'Voucher should be created');
    
    // Reload ledgers to check real-time balances
    await cashLedger.reload({ transaction: t });
    await salesLedger.reload({ transaction: t });
    
    assert.strictEqual(parseFloat(cashLedger.currentBalance), 1000, 'Cash should be Dr 1000');
    assert.strictEqual(parseFloat(salesLedger.currentBalance), 1000, 'Sales should be Cr 1000');
    console.log('✅ Test 1 Passed');

    // 3. Test Unbalanced Entry (Failure)
    console.log('Test 2: Unbalanced Journal Entry');
    let threwError = false;
    try {
      await AccountingService.recordJournalEntry({
        companyId: company.id,
        date: new Date(),
        narration: 'Unbalanced',
        voucherType: 'Journal',
        userId: user.id,
        entries: [
          { ledgerId: cashLedger.id, debit: 500, credit: 0 },
          { ledgerId: salesLedger.id, debit: 0, credit: 400 } // Doesn't match
        ]
      }, t);
    } catch (err) {
      threwError = true;
      assert.ok(err.message.includes('Unbalanced'), 'Error should mention unbalanced');
    }
    assert.ok(threwError, 'Unbalanced entry should throw error');
    console.log('✅ Test 2 Passed');

    // 4. Test Period Locking
    console.log('Test 3: Period Locking Validation');
    const lockDate = new Date();
    lockDate.setDate(lockDate.getDate() + 1); // Lock is tomorrow
    await PeriodLock.create({ CompanyId: company.id, lockDate, lockedBy: user.id }, { transaction: t });

    let lockThrewError = false;
    try {
      await AccountingService.recordJournalEntry({
        companyId: company.id,
        date: new Date(), // Today (which is <= lockDate)
        narration: 'Locked Entry',
        voucherType: 'Journal',
        userId: user.id,
        entries: [
          { ledgerId: cashLedger.id, debit: 100, credit: 0 },
          { ledgerId: salesLedger.id, debit: 0, credit: 100 }
        ]
      }, t);
    } catch (err) {
      lockThrewError = true;
      assert.ok(err.message.includes('PERIOD LOCKED'), 'Error should mention period is locked');
    }
    assert.ok(lockThrewError, 'Period lock should block entry');
    console.log('✅ Test 3 Passed');

    await t.commit();
    console.log('🎉 ALL ACCOUNTING TESTS PASSED 🎉');

  } catch (err) {
    if (t) {
      try { await t.rollback(); } catch (e) {}
    }
    console.error('❌ ACCOUNTING TEST FAILED', err);
    process.exit(1);
  } finally {
    // Cleanup
    try {
      if (typeof company !== 'undefined' && company) {
        await PeriodLock.destroy({ where: { CompanyId: company.id } });
        await Ledger.destroy({ where: { CompanyId: company.id } });
        await Voucher.destroy({ where: { CompanyId: company.id } });
        await Company.destroy({ where: { id: company.id } });
      }
      if (typeof user !== 'undefined' && user) {
        await User.destroy({ where: { id: user.id } });
      }
    } catch (cleanupErr) {
      console.error('Cleanup warning:', cleanupErr.message);
    }
  }
}

runTests().then(() => process.exit(0)).catch(() => process.exit(1));
