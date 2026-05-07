const { sequelize } = require('./models');

async function fix() {
  try {
    console.log('Adding "description" and "contactId" columns to "Transactions" table...');
    await sequelize.query('ALTER TABLE "Transactions" ADD COLUMN IF NOT EXISTS "description" TEXT;');
    await sequelize.query('ALTER TABLE "Transactions" ADD COLUMN IF NOT EXISTS "contactId" UUID;');
    console.log('✅ Columns added successfully to "Transactions" table!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to fix database schema!');
    console.error(err);
    process.exit(1);
  }
}

fix();
