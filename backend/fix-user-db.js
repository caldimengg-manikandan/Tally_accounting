const { sequelize } = require('./models');

async function fixUserDb() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB.');
    
    // Force add pendingEmail
    try {
      await sequelize.query('ALTER TABLE "Users" ADD COLUMN "pendingEmail" VARCHAR(255);');
      console.log('Added pendingEmail to Users');
    } catch(e) {
      console.log('pendingEmail error:', e.message);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Fatal Error:', err);
    process.exit(1);
  }
}

fixUserDb();
