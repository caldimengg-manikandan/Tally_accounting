const { sequelize } = require('../models');
const { DataTypes } = require('sequelize');

const MIGRATION_LOCK_TABLE = 'MigrationLocks';

async function acquireMigrationLock() {
  const queryInterface = sequelize.getQueryInterface();
  const dialect = sequelize.options.dialect;
  
  // 1. Create MigrationLocks table if it does not exist
  await queryInterface.createTable(MIGRATION_LOCK_TABLE, {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    lockedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }).catch(() => {});

  // Quote table name properly for different SQL dialects
  const quotedTable = dialect === 'postgres' ? `"${MIGRATION_LOCK_TABLE}"` : `\`${MIGRATION_LOCK_TABLE}\``;

  // 2. Ensure we have exactly one row with id = 1
  const [existing] = await sequelize.query(`SELECT * FROM ${quotedTable} WHERE id = 1;`);
  if (!existing || existing.length === 0) {
    await sequelize.query(`INSERT INTO ${quotedTable} (id, "isLocked", "lockedAt") VALUES (1, false, NULL);`).catch(async () => {
      // In SQLite/MySQL double quotes are for identifiers, let's try generic INSERT if it fails
      await sequelize.query(`INSERT INTO ${quotedTable} (id, isLocked, lockedAt) VALUES (1, false, null);`).catch(() => {});
    });
  }

  // 3. Attempt to acquire lock atomically
  const staleTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
  let lockAcquired = false;
  let attempts = 0;
  const maxAttempts = 30; // 1 minute timeout total

  while (!lockAcquired && attempts < maxAttempts) {
    let queryStr;
    if (dialect === 'postgres') {
      queryStr = `UPDATE ${quotedTable} SET "isLocked" = true, "lockedAt" = :now WHERE id = 1 AND ("isLocked" = false OR "lockedAt" < :staleTime);`;
    } else {
      queryStr = `UPDATE ${quotedTable} SET isLocked = true, lockedAt = :now WHERE id = 1 AND (isLocked = false OR lockedAt < :staleTime);`;
    }

    const [result, metadata] = await sequelize.query(queryStr, {
      replacements: { now: new Date(), staleTime },
      type: sequelize.QueryTypes.UPDATE
    });

    let rowCount = 0;
    if (dialect === 'postgres') {
      rowCount = metadata ? metadata.rowCount : 0;
    } else {
      rowCount = typeof metadata === 'number' ? metadata : (typeof result === 'number' ? result : 0);
    }

    if (rowCount > 0) {
      lockAcquired = true;
      console.log('🔒 Migration lock acquired.');
    } else {
      attempts++;
      console.log(`⏳ Migration lock busy. Retrying... (Attempt ${attempts}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  if (!lockAcquired) {
    throw new Error('❌ Failed to acquire migration lock. Another process is running migrations.');
  }
}

async function releaseMigrationLock() {
  const dialect = sequelize.options.dialect;
  const quotedTable = dialect === 'postgres' ? `"${MIGRATION_LOCK_TABLE}"` : `\`${MIGRATION_LOCK_TABLE}\``;
  
  if (dialect === 'postgres') {
    await sequelize.query(`UPDATE ${quotedTable} SET "isLocked" = false, "lockedAt" = NULL WHERE id = 1;`);
  } else {
    await sequelize.query(`UPDATE ${quotedTable} SET isLocked = false, lockedAt = null WHERE id = 1;`);
  }
  console.log('🔓 Migration lock released.');
}

module.exports = {
  acquireMigrationLock,
  releaseMigrationLock
};
