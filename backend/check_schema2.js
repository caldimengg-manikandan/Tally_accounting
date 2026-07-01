const { Sequelize } = require('sequelize');
require('dotenv').config({path: __dirname + '/.env'});
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

async function run() {
  try {
    const [cols] = await sequelize.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'SalesInvoices\'');
    console.log(cols.map(c => c.column_name).join(', '));
  } catch (e) { console.error(e) }
  process.exit(0);
}
run();
