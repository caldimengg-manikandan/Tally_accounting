const { sequelize } = require('./models');

async function fix() {
  try {
    console.log('Adding "reportingMethod" and "currency" columns to "Vouchers" table...');
    await sequelize.query('ALTER TABLE "Vouchers" ADD COLUMN IF NOT EXISTS "reportingMethod" VARCHAR(255);');
    await sequelize.query('ALTER TABLE "Vouchers" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(255);');
    console.log('✅ Columns added successfully to "Vouchers" table!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to fix database schema!');
    console.error(err);
    process.exit(1);
  }
}

fix();
