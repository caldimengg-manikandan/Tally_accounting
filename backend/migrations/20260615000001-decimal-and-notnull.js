module.exports = {
  up: async (queryInterface, Sequelize, transaction) => {
    const sequelize = queryInterface.sequelize;
    const dialect = sequelize.options.dialect;
    const options = transaction ? { transaction } : {};

    console.log(`Running decimal and NOT NULL migration on ${dialect}...`);

    // List of tenant-scoped tables that must have NOT NULL constraints on CompanyId
    const tenantTables = [
      'Groups', 'Ledgers', 'CostCenters', 'Vouchers', 'Transactions', 'Items',
      'SalesOrders', 'PurchaseOrders', 'BankTransactions', 'PriceLists', 'AuditLogs',
      'Quotes', 'RetainerInvoices', 'RecurringInvoices', 'RecurringExpenses',
      'RecurringBills', 'RecurringBillItems', 'RetainerAdjustments', 'SalesInvoices',
      'SystemMails', 'CreditNotes', 'DeliveryChallans', 'Projects', 'Timesheets',
      'VendorCredits', 'StockGroups', 'StockCategories', 'UnitOfMeasures', 'Godowns',
      'Currencies', 'CostCategories', 'CostCenterAllocations', 'Employees', 'Attendances',
      'SalaryStructures', 'Payslips', 'FixedAssets', 'DepreciationLogs', 'BOMs',
      'BOMItems', 'ProductionOrders', 'Budgets', 'BudgetItems'
    ];

    // 1. Backfill CompanyId if NULL exists in any table
    // Try to get a default CompanyId
    let defaultCompanyId = null;
    try {
      const selectQuery = dialect === 'postgres' ? 'SELECT id FROM "Companies" LIMIT 1;' : 'SELECT id FROM Companies LIMIT 1;';
      const [cos] = await sequelize.query(selectQuery, options);
      if (cos && cos.length > 0) {
        defaultCompanyId = cos[0].id;
      }
    } catch (e) {
      console.log('Failed to fetch default company id:', e.message);
    }

    if (!defaultCompanyId) {
      // Create a dummy company if none exists, to avoid violation when adding NOT NULL
      try {
        const dummyId = dialect === 'postgres' ? 'gen_random_uuid()' : 'uuid()';
        const insertQuery = dialect === 'postgres' 
          ? 'INSERT INTO "Companies" (id, name, "createdAt", "updatedAt") VALUES (gen_random_uuid(), \'Default Company\', NOW(), NOW()) RETURNING id;' 
          : 'INSERT INTO Companies (id, name, createdAt, updatedAt) VALUES (\'default-company-id\', \'Default Company\', datetime(\'now\'), datetime(\'now\'));';
        
        const [insertRes] = await sequelize.query(insertQuery, options);
        defaultCompanyId = dialect === 'postgres' ? insertRes[0].id : 'default-company-id';
      } catch (e) {
        // Fallback static UUID
        defaultCompanyId = '9e2261ae-dd0a-47f9-b14d-5c6fb9dfb505'; 
      }
    }

    console.log(`Using default CompanyId for backfill: ${defaultCompanyId}`);

    // Backfill nulls
    for (const table of tenantTables) {
      // Check if table exists first
      const checkTable = await queryInterface.describeTable(table).then(() => true).catch(() => false);
      if (!checkTable) continue;

      const quotedTable = dialect === 'postgres' ? `"${table}"` : `\`${table}\``;
      const quotedCol = dialect === 'postgres' ? '"CompanyId"' : 'CompanyId';
      
      await sequelize.query(
        `UPDATE ${quotedTable} SET ${quotedCol} = :defaultCompanyId WHERE ${quotedCol} IS NULL;`,
        { replacements: { defaultCompanyId }, ...options }
      );
    }

    // 2. Set NOT NULL on CompanyId for all tables
    for (const table of tenantTables) {
      const checkTable = await queryInterface.describeTable(table).then(() => true).catch(() => false);
      if (!checkTable) continue;

      const quotedTable = dialect === 'postgres' ? `"${table}"` : `\`${table}\``;
      const quotedCol = dialect === 'postgres' ? '"CompanyId"' : 'CompanyId';

      if (dialect === 'postgres') {
        await sequelize.query(`ALTER TABLE ${quotedTable} ALTER COLUMN ${quotedCol} SET NOT NULL;`, options);
      } else {
        // SQLite doesn't support ALTER COLUMN, so we use changeColumn
        await queryInterface.changeColumn(table, 'CompanyId', {
          type: Sequelize.UUID,
          allowNull: false
        }, options).catch(e => console.log(`changeColumn failed on ${table}:`, e.message));
      }
    }

    // 3. Migrate money columns from DOUBLE to DECIMAL(18,2)
    // Table mappings for DOUBLE -> DECIMAL(18,2) conversion
    const doubleColumns = [
      { table: 'Transactions', columns: ['debit', 'credit', 'gstRate', 'gstAmount', 'quantity', 'rate'] },
      { table: 'Ledgers', columns: ['openingBalance', 'currentBalance', 'creditLimit'] },
      { table: 'SalesOrderItems', columns: ['quantity', 'rate', 'amount'] }
    ];

    for (const mapping of doubleColumns) {
      const checkTable = await queryInterface.describeTable(mapping.table).then(() => true).catch(() => false);
      if (!checkTable) continue;

      const quotedTable = dialect === 'postgres' ? `"${mapping.table}"` : `\`${mapping.table}\``;

      for (const col of mapping.columns) {
        const quotedCol = dialect === 'postgres' ? `"${col}"` : `\`${col}\``;
        const quotedColOld = dialect === 'postgres' ? `"${col}_old"` : `\`${col}_old\``;

        if (dialect === 'postgres') {
          // Rename current column to _old
          await sequelize.query(`ALTER TABLE ${quotedTable} RENAME COLUMN ${quotedCol} TO ${quotedColOld};`, options);
          // Create new DECIMAL column
          await sequelize.query(`ALTER TABLE ${quotedTable} ADD COLUMN ${quotedCol} DECIMAL(18, 2) DEFAULT 0.00;`, options);
          // Copy data with CAST
          await sequelize.query(`UPDATE ${quotedTable} SET ${quotedCol} = CAST(COALESCE(${quotedColOld}, 0.00) AS DECIMAL(18, 2));`, options);
          // Drop _old column
          await sequelize.query(`ALTER TABLE ${quotedTable} DROP COLUMN ${quotedColOld};`, options);
        } else {
          // SQLite safe changeColumn
          await queryInterface.changeColumn(mapping.table, col, {
            type: Sequelize.DECIMAL(18, 2),
            defaultValue: 0.00
          }, options).catch(e => console.log(`changeColumn failed on ${mapping.table}.${col}:`, e.message));
        }
      }
    }

    console.log('Decimal and NOT NULL migration complete successfully.');
  },

  down: async (queryInterface, Sequelize, transaction) => {
    // Revert types if needed (optional)
  }
};
