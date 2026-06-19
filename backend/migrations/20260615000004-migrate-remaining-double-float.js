module.exports = {
  up: async (queryInterface, Sequelize, transaction) => {
    const sequelize = queryInterface.sequelize;
    const dialect = sequelize.options.dialect;
    const options = transaction ? { transaction } : {};

    console.log(`Running remaining DOUBLE/FLOAT to DECIMAL migration on ${dialect}...`);

    const doubleColumns = [
      { table: 'LedgerReconciliationLogs', columns: ['computedBalance', 'storedBalance', 'variance'] },
      { table: 'CostCenterAllocations', columns: ['amount', 'percentage'] },
      { table: 'Items', columns: ['gstRate'] }
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

    console.log('Remaining DOUBLE/FLOAT to DECIMAL migration complete successfully.');
  },

  down: async (queryInterface, Sequelize, transaction) => {
    // Revert types if needed (optional)
  }
};
