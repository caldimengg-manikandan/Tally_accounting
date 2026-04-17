const { Item, Company } = require('../models');

async function run() {
  try {
    const allItems = await Item.findAll({ 
      include: [{ model: Company }],
      raw: true,
      nest: true
    });
    
    if (allItems.length === 0) {
      console.log('No items found in the entire database.');
    } else {
      console.log(`Found ${allItems.length} items total:`);
      allItems.forEach(i => {
        console.log(`- Item Name: ${i.name}`);
        console.log(`  Company: ${i.Company ? i.Company.name : 'NONE'} (${i.CompanyId})`);
      });
    }
  } catch (err) {
    console.error('Error fetching all items:', err);
  } finally {
    process.exit();
  }
}

run();
