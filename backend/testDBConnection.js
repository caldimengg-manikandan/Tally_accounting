const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Sequelize } = require('sequelize');

async function test() {
  const dbUrl = process.env.DATABASE_URL;
  const sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    logging: false
  });
  
  try {
    console.log("Adding postingDate...");
    await sequelize.query(`ALTER TABLE "Transactions" ADD COLUMN "postingDate" TIMESTAMP WITH TIME ZONE;`);
    console.log("Success!");
  } catch (e) {
    console.error("postingDate Error:", e.message);
  }
  
  try {
    console.log("Adding hierarchyPath...");
    await sequelize.query(`ALTER TABLE "Groups" ADD COLUMN "hierarchyPath" VARCHAR(255);`);
    console.log("Success!");
  } catch (e) {
    console.error("hierarchyPath Error:", e.message);
  }

  process.exit(0);
}
test();
