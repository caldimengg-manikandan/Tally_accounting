const { sequelize } = require('./models');

async function fix() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    
    // Add columns directly
    const queries = [
      'ALTER TABLE "SalaryStructures" ADD COLUMN IF NOT EXISTS "annualCtc" DECIMAL(12, 2) DEFAULT 0;',
      'ALTER TABLE "SalaryStructures" ADD COLUMN IF NOT EXISTS "monthlyBasic" DECIMAL(12, 2) DEFAULT 0;',
      'ALTER TABLE "SalaryStructures" ADD COLUMN IF NOT EXISTS "monthlyFixedAllowance" DECIMAL(12, 2) DEFAULT 0;',
      'ALTER TABLE "SalaryStructures" ADD COLUMN IF NOT EXISTS "annualBasic" DECIMAL(12, 2) DEFAULT 0;',
      'ALTER TABLE "SalaryStructures" ADD COLUMN IF NOT EXISTS "annualFixedAllowance" DECIMAL(12, 2) DEFAULT 0;'
    ];
    
    for (const q of queries) {
      try {
        await sequelize.query(q);
        console.log('Executed:', q);
      } catch (e) {
        console.error('Error on query:', q, e.message);
      }
    }
    
    console.log('Database fixed for SalaryStructure!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
