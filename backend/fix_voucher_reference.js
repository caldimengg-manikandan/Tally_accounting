const { sequelize } = require('./models');

async function fix() {
  try {
    console.log('Adding "reference" column to "Vouchers" table...');
    await sequelize.query('ALTER TABLE "Vouchers" ADD COLUMN IF NOT EXISTS "reference" VARCHAR(255);');
    console.log('✅ Column "reference" added successfully to "Vouchers" table!');
    
    // Also check if Transaction model uses it, though it seems not from AccountingService
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to fix database schema!');
    console.error(err);
    process.exit(1);
  }
}

fix();
