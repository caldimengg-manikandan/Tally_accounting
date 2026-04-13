const { sequelize } = require('./models');

async function fix() {
  try {
    console.log("ADDING MISSING COLUMNS...");
    await sequelize.query('ALTER TABLE "Ledgers" ADD COLUMN IF NOT EXISTS "groupName" VARCHAR(255);');
    console.log("✅ Column groupName added to Ledgers.");
    
    // Check projects too
    await sequelize.query('ALTER TABLE "Projects" ADD COLUMN IF NOT EXISTS "projectCode" VARCHAR(255);');
    await sequelize.query('ALTER TABLE "Projects" ADD COLUMN IF NOT EXISTS "costBudget" DOUBLE PRECISION DEFAULT 0;');
    await sequelize.query('ALTER TABLE "Projects" ADD COLUMN IF NOT EXISTS "revenueBudget" DOUBLE PRECISION DEFAULT 0;');
    await sequelize.query('ALTER TABLE "Projects" ADD COLUMN IF NOT EXISTS "addToWatchlist" BOOLEAN DEFAULT false;');
    console.log("✅ Columns added to Projects.");

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
