const { sequelize } = require('./models');

async function forceFixDb() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB.');
    
    // Force add pfCap
    try {
      await sequelize.query('ALTER TABLE "PayrollSettings" ADD COLUMN "pfCap" DECIMAL(10, 2) DEFAULT 1800.00;');
      console.log('Added pfCap to PayrollSettings');
    } catch(e) {
      console.log('pfCap error:', e.message);
    }
    
    // Force add esiThreshold
    try {
      await sequelize.query('ALTER TABLE "PayrollSettings" ADD COLUMN "esiThreshold" DECIMAL(10, 2) DEFAULT 21000.00;');
      console.log('Added esiThreshold to PayrollSettings');
    } catch(e) {
      console.log('esiThreshold error:', e.message);
    }

    // Force add componentNature
    try {
      await sequelize.query('ALTER TABLE "SalaryComponents" ADD COLUMN "componentNature" VARCHAR(255) DEFAULT \'Fixed\';');
      console.log('Added componentNature to SalaryComponents');
    } catch(e) {
      console.log('componentNature error:', e.message);
    }

    // Double check columns
    const [psCols] = await sequelize.query('SELECT column_name FROM information_schema.columns WHERE table_name=\'PayrollSettings\';');
    console.log('PayrollSettings columns:', psCols.map(c => c.column_name).join(', '));
    
    const [scCols] = await sequelize.query('SELECT column_name FROM information_schema.columns WHERE table_name=\'SalaryComponents\';');
    console.log('SalaryComponents columns:', scCols.map(c => c.column_name).join(', '));

    process.exit(0);
  } catch (err) {
    console.error('Fatal Error:', err);
    process.exit(1);
  }
}

forceFixDb();
