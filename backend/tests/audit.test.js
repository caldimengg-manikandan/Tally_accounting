const { sequelize, Voucher, AuditLog, Company, User } = require('../models');
const { getNamespace } = require('../middleware/cls.middleware');
const assert = require('assert');

async function runTests() {
  console.log('--- STARTING AUDIT INTEGRATION TEST ---');
  // Avoid syncing everything if DB is already created, but we need to ensure connection
  await sequelize.authenticate();

  const namespace = getNamespace();
  if (!namespace) {
    throw new Error('CLS Hooked namespace not found. Did you initialize it?');
  }

  const testEmail = `test_audit_${Date.now()}@example.com`;

  // Create dummy user and company for context
  const user = await User.create({ email: testEmail, name: 'Audit Test User', password: 'pwd', role: 'ADMIN' });
  const company = await Company.create({ name: 'Audit Test Company', userId: user.id });

  await new Promise((resolve, reject) => {
    namespace.run(async () => {
      try {
        namespace.set('userId', user.id);
        namespace.set('companyId', company.id);

        console.log('1. Creating Voucher');
        const voucher = await Voucher.create({
          CompanyId: company.id,
          voucherType: 'Journal',
          date: new Date(),
          voucherNumber: `TEST-${Date.now()}`,
          narration: 'Initial creation'
        });

        console.log('2. Updating Voucher');
        voucher.narration = 'Updated narration';
        await voucher.save();

        console.log('3. Deleting Voucher');
        await voucher.destroy();

        // 4. Verification
        const logs = await AuditLog.findAll({
          where: { recordId: voucher.id.toString(), tableName: 'Voucher' },
          order: [['createdAt', 'ASC']]
        });

        assert.strictEqual(logs.length, 3, `Expected 3 logs, got ${logs.length}`);

        assert.ok(logs[0].action.includes('CREATE'), 'First log should be CREATE');
        assert.ok(logs[0].newData, 'CREATE log should have newData');
        assert.strictEqual(logs[0].oldData, null, 'CREATE log should not have oldData');
        assert.strictEqual(logs[0].UserId, user.id);
        assert.strictEqual(logs[0].CompanyId, company.id);

        assert.ok(logs[1].action.includes('UPDATE'), 'Second log should be UPDATE');
        assert.ok(logs[1].newData, 'UPDATE log should have newData');
        assert.ok(logs[1].oldData, 'UPDATE log should have oldData');
        assert.strictEqual(logs[1].newData.narration, 'Updated narration');

        assert.ok(logs[2].action.includes('DELETE'), 'Third log should be DELETE');
        assert.ok(logs[2].oldData, 'DELETE log should have oldData');

        console.log('✅ AUDIT INTEGRATION TEST PASSED');
        resolve();
      } catch (err) {
        console.error('❌ TEST FAILED', err);
        reject(err);
      } finally {
        // Cleanup
        await AuditLog.destroy({ where: { CompanyId: company.id } });
        await Company.destroy({ where: { id: company.id } });
        await User.destroy({ where: { id: user.id } });
      }
    });
  });
}

runTests().then(() => process.exit(0)).catch(() => process.exit(1));
