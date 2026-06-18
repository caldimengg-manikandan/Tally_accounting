module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const options = { transaction };
    try {
      console.log('Adding performance indexes...');

      const tables = ['Transactions', 'Vouchers', 'Ledgers', 'SalesInvoices', 'PurchaseOrders', 'Items', 'Employees', 'AuditLogs'];
      const existingTables = {};
      for (const t of tables) {
        existingTables[t] = await queryInterface.describeTable(t).then(() => true).catch(() => false);
        console.log(`Table ${t} exists: ${existingTables[t]}`);
      }

      // 1. Transactions indexes
      if (existingTables['Transactions']) {
        await queryInterface.addIndex('Transactions', ['CompanyId', 'createdAt'], options).catch(e => console.log('Index Transactions(CompanyId, createdAt) already exists or failed:', e.message));
        await queryInterface.addIndex('Transactions', ['LedgerId'], options).catch(e => console.log('Index Transactions(LedgerId) already exists or failed:', e.message));
        await queryInterface.addIndex('Transactions', ['VoucherId'], options).catch(e => console.log('Index Transactions(VoucherId) already exists or failed:', e.message));
      }

      // 2. Vouchers indexes
      if (existingTables['Vouchers']) {
        await queryInterface.addIndex('Vouchers', ['CompanyId', 'date', 'status', 'voucherType'], options).catch(e => console.log('Index Vouchers(CompanyId, date, status, voucherType) already exists or failed:', e.message));
      }

      // 3. Ledgers indexes
      if (existingTables['Ledgers']) {
        await queryInterface.addIndex('Ledgers', ['CompanyId', 'GroupId'], options).catch(e => console.log('Index Ledgers(CompanyId, GroupId) already exists or failed:', e.message));
      }

      // 4. SalesInvoices indexes
      if (existingTables['SalesInvoices']) {
        await queryInterface.addIndex('SalesInvoices', ['CompanyId', 'status', 'date'], options).catch(e => console.log('Index SalesInvoices(CompanyId, status, date) already exists or failed:', e.message));
      }

      // 5. PurchaseOrders indexes
      if (existingTables['PurchaseOrders']) {
        await queryInterface.addIndex('PurchaseOrders', ['CompanyId', 'status'], options).catch(e => console.log('Index PurchaseOrders(CompanyId, status) already exists or failed:', e.message));
      }

      // 6. Items indexes
      if (existingTables['Items']) {
        await queryInterface.addIndex('Items', ['CompanyId'], options).catch(e => console.log('Index Items(CompanyId) already exists or failed:', e.message));
      }

      // 7. Employees indexes
      if (existingTables['Employees']) {
        await queryInterface.addIndex('Employees', ['CompanyId'], options).catch(e => console.log('Index Employees(CompanyId) already exists or failed:', e.message));
      }

      // 8. AuditLogs indexes
      if (existingTables['AuditLogs']) {
        await queryInterface.addIndex('AuditLogs', ['CompanyId', 'createdAt'], options).catch(e => console.log('Index AuditLogs(CompanyId, createdAt) already exists or failed:', e.message));
      }

      await transaction.commit();
      console.log('Indexes migration completed successfully.');
    } catch (error) {
      await transaction.rollback();
      console.error('Failed to apply indexes migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Optional rollback logic
  }
};
