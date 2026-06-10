const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sequelize } = require('./models');

async function doMigrations() {
  try {
    const columnsToAdd = [
      `ALTER TABLE "Users" ADD COLUMN "mfaSecret" VARCHAR(255);`,
      `ALTER TABLE "Users" ADD COLUMN "mfaEnabled" BOOLEAN DEFAULT false;`,
      `ALTER TABLE "Transactions" ADD COLUMN "postingDate" TIMESTAMP WITH TIME ZONE;`
    ];
    
    for (const q of columnsToAdd) {
      try {
        await sequelize.query(q);
        console.log("Executed:", q);
      } catch (err) {
        console.log("Skipped/Error on:", q, "->", err.message);
      }
    }
  } catch (err) {
    console.error("DB error:", err.message);
  } finally {
    process.exit(0);
  }
}

doMigrations();
