const { sequelize } = require('./models');

async function fix() {
  try {
    await sequelize.query('ALTER TABLE "Employees" ADD COLUMN "emergencyContactRelationship" VARCHAR(255);');
    console.log('emergencyContactRelationship added.');
  } catch (e) {
    console.error('emergencyContactRelationship error:', e.message);
  }
  
  try {
    await sequelize.query('ALTER TABLE "Employees" ADD COLUMN "emergencyContactName" VARCHAR(255);');
    console.log('emergencyContactName added.');
  } catch (e) {
    console.error('emergencyContactName error:', e.message);
  }
  
  try {
    await sequelize.query('ALTER TABLE "Employees" ADD COLUMN "emergencyContactPhone" VARCHAR(255);');
    console.log('emergencyContactPhone added.');
  } catch (e) {
    console.error('emergencyContactPhone error:', e.message);
  }
  
  process.exit(0);
}

fix();
