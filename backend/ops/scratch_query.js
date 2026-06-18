const { PurchaseOrder, Ledger, Company } = require('./models');

async function test() {
  try {
    const companies = await Company.findAll();
    console.log('--- Companies ---');
    companies.forEach(c => console.log(`ID: ${c.id}, Name: ${c.name}`));

    const ledgers = await Ledger.findAll();
    console.log(`\n--- Ledgers (Total: ${ledgers.length}) ---`);
    
    const orders = await PurchaseOrder.findAll({
      include: [{ model: Ledger }]
    });
    console.log(`\n--- Purchase Orders (Total: ${orders.length}) ---`);
    orders.forEach(o => {
      console.log(`ID: ${o.id}, Order#: ${o.orderNumber}, Date: ${o.date}, Total: ${o.totalAmount}, CompanyId: ${o.CompanyId}, LedgerName: ${o.Ledger?.name || 'none'}`);
    });
    
  } catch (err) {
    console.error('Error during test query:', err);
  }
  process.exit(0);
}

test();
