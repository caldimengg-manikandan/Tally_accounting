const { sequelize } = require('./models');

/**
 * DATABASE RECOVERY TOOL (Force Sync)
 * Use this only when 'alter: true' fails due to schema corruption 
 * or complex relationship changes in development.
 */
async function forceReset() {
  try {
    console.log('⚠️  INITIATING DATABASE SUPER-RECOVERY (Postgres)...');
    console.log('--- Wiping & Rebuilding Tables from Scratch ---');
    
    // Using force: true to wipe and rebuild
    await sequelize.sync({ force: true });
    
    console.log('\n✅ DATABASE RECOVERED SUCCESSFULLY (Postgres).');
    console.log('The schema has been rebuilt from a clean state.');
    console.log('You can now run "npm run dev" to start fresh.');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ RESET FAILED:');
    console.error(err);
    process.exit(1);
  }
}

forceReset();
