const { Item, StockMovement } = require('./backend/models');

async function check() {
  const items = await Item.findAll({ where: { name: 'Dell Laptop' } });
  for (const item of items) {
    console.log(`Item: ${item.name}, ID: ${item.id}, CurrentStock: ${item.currentStock}`);
    const movements = await StockMovement.findAll({ where: { ItemId: item.id } });
    console.log(`Movements: ${movements.length}`);
    movements.forEach(m => {
      console.log(`- Type: ${m.movementType}, Qty: ${m.quantity}, Date: ${m.date}`);
    });
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
