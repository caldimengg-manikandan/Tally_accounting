const { sequelize } = require('./models');

async function fix() {
  try {
    await sequelize.query('ALTER TABLE "Employees" ADD COLUMN "mobileNumber" VARCHAR(255) DEFAULT \'0000000000\';');
    console.log('mobileNumber added.');
  } catch (e) {
    console.error('mobileNumber error:', e.message);
  }
  
  try {
    await sequelize.query('ALTER TABLE "Employees" ADD COLUMN "workEmail" VARCHAR(255);');
    console.log('workEmail added.');
  } catch (e) {
    console.error('workEmail error:', e.message);
  }

  process.exit(0);
}

fix();
