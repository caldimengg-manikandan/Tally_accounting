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
    const res = await sequelize.query(`SELECT table_schema, column_name FROM information_schema.columns WHERE table_name = 'Users'`);
    console.log("All schemas Users columns:", res[0]);
  } catch (e) {
    console.error("URL DB Error:", e.message);
  }
  
  process.exit(0);
}
test();
