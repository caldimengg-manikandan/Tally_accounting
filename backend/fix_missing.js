const { sequelize } = require('./models');

async function fix() {
  try {
    await sequelize.query('ALTER TABLE "Items" ADD COLUMN "standardRate" DECIMAL(15,2) DEFAULT 0');
    console.log('Added standardRate');
  } catch (e) {
    console.error(e.message);
  }
  
  try {
    await sequelize.query('ALTER TABLE "Items" ADD COLUMN "gstRate" DECIMAL(5,2) DEFAULT 18');
    console.log('Added gstRate');
  } catch (e) {
    console.error(e.message);
  }
  process.exit();
}

fix();
