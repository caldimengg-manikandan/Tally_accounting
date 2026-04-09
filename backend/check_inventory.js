const { Item, Company } = require('./models');

async function checkInventory() {
  try {
    const companies = await Company.findAll({ raw: true });
    for (const co of companies) {
      console.log(`\n--- COMPANY: ${co.name} (${co.id}) ---`);
      const items = await Item.findAll({ where: { CompanyId: co.id }, raw: true });
      console.log(`INVENTORY ITEMS: ${items.length}`);
      items.forEach(it => {
        console.log(` - ID: ${it.id}, Name: ${it.name}, Rate: ${it.sellingPrice}`);
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkInventory();
