const { sequelize } = require('./models');

async function run() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const tableDesc = await queryInterface.describeTable('UserCompanies');
    if (!tableDesc.role) {
      console.log('Adding "role" column to UserCompanies table...');
      await sequelize.query('ALTER TABLE "UserCompanies" ADD COLUMN "role" VARCHAR(50) DEFAULT \'VIEWER\';');
      console.log('Successfully added "role" column.');
    } else {
      console.log('"role" column already exists in UserCompanies.');
    }
  } catch (err) {
    console.error('Error during DB schema migration:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
