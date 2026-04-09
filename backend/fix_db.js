const { sequelize } = require('./models');

async function fixDb() {
  try {
    console.log('--- FIXING DB COLUMNS ---');
    
    // Add columns to RetainerInvoices
    await sequelize.query('ALTER TABLE "RetainerInvoices" ADD COLUMN IF NOT EXISTS "amountReceived" DECIMAL(15,2) DEFAULT 0');
    await sequelize.query('ALTER TABLE "RetainerInvoices" ADD COLUMN IF NOT EXISTS "amountUsed" DECIMAL(15,2) DEFAULT 0');
    
    // Add columns to RecurringInvoices just in case
    await sequelize.query('ALTER TABLE "RecurringInvoices" ADD COLUMN IF NOT EXISTS "lastRunDate" TIMESTAMP WITH TIME ZONE');
    await sequelize.query('ALTER TABLE "RecurringInvoices" ADD COLUMN IF NOT EXISTS "nextRunDate" TIMESTAMP WITH TIME ZONE');
    
    console.log('DB FIXED SUCCESSFULLY');
  } catch (err) {
    console.error('FIX FAILED:', err.message);
  } finally {
    process.exit();
  }
}

fixDb();
