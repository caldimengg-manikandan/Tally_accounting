const { sequelize } = require('./backend/models');

async function alterDb() {
  const queries = [
    'ALTER TABLE "SalesInvoices" ADD COLUMN "tcsApplicable" BOOLEAN DEFAULT false;',
    'ALTER TABLE "SalesInvoices" ADD COLUMN "tcsRate" DECIMAL(5,2) DEFAULT 0;',
    'ALTER TABLE "SalesInvoices" ADD COLUMN "tcsAmount" DECIMAL(20,2) DEFAULT 0;',
    'ALTER TABLE "SalesOrders" ADD COLUMN "tcsApplicable" BOOLEAN DEFAULT false;',
    'ALTER TABLE "SalesOrders" ADD COLUMN "tcsRate" DECIMAL(5,2) DEFAULT 0;',
    'ALTER TABLE "SalesOrders" ADD COLUMN "tcsAmount" DECIMAL(15,2) DEFAULT 0;'
  ];

  for (let q of queries) {
    try {
      await sequelize.query(q);
      console.log('Success:', q);
    } catch(e) {
      console.log('Error:', e.message);
    }
  }
}

alterDb();
