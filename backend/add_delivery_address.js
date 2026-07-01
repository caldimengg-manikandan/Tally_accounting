require('dotenv').config();
const { sequelize } = require('./models');

sequelize.query('ALTER TABLE "SalesInvoices" ADD COLUMN "deliveryAddress" TEXT;')
  .then(() => {
    console.log('Column deliveryAddress added successfully');
    process.exit(0);
  })
  .catch(e => {
    if (e.message.includes('already exists')) {
        console.log('Column deliveryAddress already exists');
        process.exit(0);
    }
    console.error(e);
    process.exit(1);
  });
