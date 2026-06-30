const { sequelize } = require('../models');

async function fixUserTable() {
  try {
    console.log('Adding pendingEmail column to Users table...');
    // Add the column. If it already exists, this might throw, which is fine, we just catch it.
    await sequelize.query('ALTER TABLE "Users" ADD COLUMN "pendingEmail" VARCHAR(255);');
    console.log('✅ Successfully added pendingEmail column!');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('✅ Column already exists!');
    } else {
      console.error('❌ Error:', err.message);
    }
  } finally {
    process.exit(0);
  }
}

fixUserTable();
