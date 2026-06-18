const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');
const { acquireMigrationLock, releaseMigrationLock } = require('./lock_helper');

async function runMigrations() {
  const queryInterface = sequelize.getQueryInterface();
  const dialect = sequelize.options.dialect;
  
  // Acquire distributed lock
  await acquireMigrationLock();

  try {
    // 1. Create SequelizeMeta table if it doesn't exist
    const quotedMeta = dialect === 'postgres' ? '"SequelizeMeta"' : '`SequelizeMeta`';
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ${quotedMeta} (
        name VARCHAR(255) NOT NULL PRIMARY KEY
      );
    `).catch(async () => {
      // Fallback create table using standard syntax if dialect doesn't support IF NOT EXISTS in query
      await queryInterface.createTable('SequelizeMeta', {
        name: {
          type: sequelize.Sequelize.STRING(255),
          primaryKey: true,
          allowNull: false
        }
      }).catch(() => {});
    });

    // 2. Scan db-migrations directory
    const migrationsDir = path.join(__dirname, '../db-migrations');
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js'))
      .sort(); // Sort alphabetically to run sequentially

    // 3. Fetch already applied migrations
    const [rows] = await sequelize.query(`SELECT name FROM ${quotedMeta};`);
    const applied = new Set(rows.map(r => r.name));

    console.log(`🔍 Found ${files.length} migrations, ${applied.size} already applied.`);

    // 4. Run pending migrations
    for (const file of files) {
      if (applied.has(file)) continue;

      console.log(`🚀 Running migration: ${file}...`);
      const migration = require(path.join(migrationsDir, file));
      
      const t = await sequelize.transaction();
      try {
        await migration.up(queryInterface, sequelize.Sequelize, t);
        
        // Mark as applied in SequelizeMeta
        await sequelize.query(`INSERT INTO ${quotedMeta} (name) VALUES (:name);`, {
          replacements: { name: file },
          type: sequelize.QueryTypes.INSERT,
          transaction: t
        });
        
        await t.commit();
        console.log(`✅ Migration successful: ${file}`);
      } catch (err) {
        await t.rollback();
        console.error(`❌ Migration failed: ${file}. Transaction rolled back.`);
        throw err;
      }
    }
    
    console.log('🎉 Database migrations are up to date.');
  } finally {
    // Release distributed lock
    await releaseMigrationLock();
  }
}

module.exports = { runMigrations };
