require('dotenv').config();
const { sequelize } = require('./models');

sequelize.query('ALTER TABLE "SalesInvoices" ADD COLUMN "gstPercent" DECIMAL(5,2) DEFAULT 0;')
  .then(() => {
    console.log('Column gstPercent added successfully');
    process.exit(0);
  })
  .catch(e => {
    if (e.message.includes('already exists')) {
        console.log('Column gstPercent already exists');
        process.exit(0);
    }
    console.error(e);
    process.exit(1);
  });
