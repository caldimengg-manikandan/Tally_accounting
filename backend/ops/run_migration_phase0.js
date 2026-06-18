const { sequelize } = require('./models');

async function run() {
  const queryInterface = sequelize.getQueryInterface();
  const dialect = sequelize.options.dialect;
  console.log(`Running migration for dialect: ${dialect}...`);

  // Add Company columns
  await queryInterface.addColumn('Companies', 'financialYearClosed', {
    type: sequelize.Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }).catch(e => console.log('financialYearClosed already exists or error:', e.message));

  await queryInterface.addColumn('Companies', 'lastClosedDate', {
    type: sequelize.Sequelize.DATE,
    allowNull: true
  }).catch(e => console.log('lastClosedDate already exists or error:', e.message));

  // Add Transaction columns
  await queryInterface.addColumn('Transactions', 'currency', {
    type: sequelize.Sequelize.STRING,
    allowNull: false,
    defaultValue: 'INR'
  }).catch(e => console.log('currency already exists or error:', e.message));

  await queryInterface.addColumn('Transactions', 'exchangeRate', {
    type: sequelize.Sequelize.DECIMAL(18, 6),
    allowNull: false,
    defaultValue: 1.000000
  }).catch(e => console.log('exchangeRate already exists or error:', e.message));

  await queryInterface.addColumn('Transactions', 'baseCurrencyAmount', {
    type: sequelize.Sequelize.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0.00
  }).catch(e => console.log('baseCurrencyAmount already exists or error:', e.message));

  // Create LedgerReconciliationLogs table
  await queryInterface.createTable('LedgerReconciliationLogs', {
    id: {
      type: sequelize.Sequelize.UUID,
      defaultValue: sequelize.Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    CompanyId: {
      type: sequelize.Sequelize.UUID,
      allowNull: false
    },
    LedgerId: {
      type: sequelize.Sequelize.UUID,
      allowNull: false
    },
    computedBalance: {
      type: sequelize.Sequelize.DOUBLE,
      defaultValue: 0.00
    },
    storedBalance: {
      type: sequelize.Sequelize.DOUBLE,
      defaultValue: 0.00
    },
    variance: {
      type: sequelize.Sequelize.DOUBLE,
      defaultValue: 0.00
    },
    reconciledAt: {
      type: sequelize.Sequelize.DATE,
      defaultValue: sequelize.Sequelize.NOW
    },
    createdAt: {
      type: sequelize.Sequelize.DATE,
      allowNull: false,
      defaultValue: sequelize.Sequelize.NOW
    },
    updatedAt: {
      type: sequelize.Sequelize.DATE,
      allowNull: false,
      defaultValue: sequelize.Sequelize.NOW
    }
  }).catch(e => console.log('LedgerReconciliationLogs already exists or error:', e.message));

  // Data migrations
  console.log('Running data normalization updates...');
  
  if (dialect === 'postgres') {
    await sequelize.query('UPDATE "Vouchers" SET status = UPPER(status) WHERE status IS NOT NULL;');
    await sequelize.query(`UPDATE "Vouchers" SET status = 'DRAFT' WHERE status IS NULL;`);
    await sequelize.query(`UPDATE "Transactions" SET "baseCurrencyAmount" = COALESCE(NULLIF(debit, 0), credit) WHERE "baseCurrencyAmount" = 0;`);
  } else {
    await sequelize.query('UPDATE Vouchers SET status = UPPER(status) WHERE status IS NOT NULL;');
    await sequelize.query(`UPDATE Vouchers SET status = 'DRAFT' WHERE status IS NULL;`);
    await sequelize.query(`UPDATE Transactions SET baseCurrencyAmount = CASE WHEN debit > 0 THEN debit ELSE credit END WHERE baseCurrencyAmount = 0;`);
  }

  console.log('Migration complete!');
  process.exit(0);
}

run().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
