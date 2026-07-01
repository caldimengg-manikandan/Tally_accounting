const { Sequelize } = require('sequelize');
require('dotenv').config({path: __dirname + '/.env'});
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

async function run() {
  const [results] = await sequelize.query('SELECT t.*, l.name, l."openingBalance" FROM "Transactions" t JOIN "Ledgers" l ON t."LedgerId" = l.id WHERE l.name LIKE \'%Apex%\'');
  console.log('Transactions:', results);
  
  const [ledgers] = await sequelize.query('SELECT * FROM "Ledgers" WHERE name LIKE \'%Apex%\'');
  console.log('Ledger:', ledgers[0]);
  process.exit(0);
}
run();
