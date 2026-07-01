const { Sequelize } = require('sequelize');
require('dotenv').config({path: __dirname + '/.env'});
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

async function run() {
  const [invoices] = await sequelize.query('SELECT * FROM "SalesInvoices" WHERE "totalAmount" = 295295 OR "totalAmount" = 250000');
  console.log('Invoices:', invoices.map(i => ({ id: i.id, num: i.invoiceNumber, total: i.totalAmount, date: i.createdAt, voucherId: i.VoucherId })));
  
  const [vouchers] = await sequelize.query('SELECT * FROM "Vouchers" WHERE "CompanyId" = \'ddd9f764-bd93-4cb0-bd3f-800be42b42b0\' ORDER BY "createdAt" DESC LIMIT 10');
  console.log('Vouchers:', vouchers.map(v => ({ id: v.id, date: v.createdAt })));
  process.exit(0);
}
run();
