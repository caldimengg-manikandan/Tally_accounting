const { sequelize, Item } = require('../models');

async function fixItemFlags() {
  try {
    const items = await Item.findAll();
    for (const item of items) {
      let updated = false;
      
      // If selling price is 0 or null, it's not a sales item
      if (!item.sellingPrice || parseFloat(item.sellingPrice) === 0) {
        if (item.salesInformation !== false) {
          item.salesInformation = false;
          updated = true;
        }
      }
      
      // If cost price is 0 or null, it's not a purchase item
      if (!item.costPrice || parseFloat(item.costPrice) === 0) {
        if (item.purchaseInformation !== false) {
          item.purchaseInformation = false;
          updated = true;
        }
      }
      
      // Ensure at least one is true if both are 0, maybe default to sales
      if (!item.salesInformation && !item.purchaseInformation) {
        // if neither, make it just a sales item with 0 price to be safe, or leave it. 
        // Let's just leave it, maybe they are just tracking stock.
      }
      
      if (updated) {
        await item.save();
        console.log(`Updated item: ${item.name} | Sales: ${item.salesInformation} | Purchase: ${item.purchaseInformation}`);
      }
    }
    console.log('✅ Done updating item flags.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

fixItemFlags();
