const { sequelize } = require('./models');

async function fixUserDb() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB.');
    
    const alterCommands = [
      'ALTER TABLE "Users" ADD COLUMN "emailVerificationToken" VARCHAR(255);',
      'ALTER TABLE "Users" ADD COLUMN "emailVerificationExpiry" TIMESTAMP WITH TIME ZONE;',
      'ALTER TABLE "Users" ADD COLUMN "notificationPreferences" JSON;'
    ];

    for (const cmd of alterCommands) {
      try {
        await sequelize.query(cmd);
        console.log('Executed:', cmd);
      } catch(e) {
        console.log('Error executing:', cmd, e.message);
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Fatal Error:', err);
    process.exit(1);
  }
}

fixUserDb();
