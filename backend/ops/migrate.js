const { execSync } = require('child_process');
const { acquireMigrationLock, releaseMigrationLock } = require('../helpers/lock_helper');
const { sequelize } = require('../models');

async function run() {
  console.log('🔒 [MIGRATION-WRAPPER] Acquiring migration lock...');
  await acquireMigrationLock();
  try {
    console.log('🚀 [MIGRATION-WRAPPER] Running sequelize-cli db:migrate...');
    execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
    console.log('✅ [MIGRATION-WRAPPER] Migrations completed successfully.');
  } catch (error) {
    console.error('❌ [MIGRATION-WRAPPER] Migration failed:', error.message);
    process.exit(1);
  } finally {
    console.log('🔓 [MIGRATION-WRAPPER] Releasing migration lock...');
    await releaseMigrationLock();
    // Close sequelize connection to allow process to exit clean
    await sequelize.close();
    console.log('🏁 [MIGRATION-WRAPPER] Database connection closed.');
  }
}

run();
