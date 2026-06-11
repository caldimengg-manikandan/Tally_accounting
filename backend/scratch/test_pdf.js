const { PurchaseOrder } = require('../models');

async function test() {
  const order = await PurchaseOrder.findOne({
    where: { orderNumber: 'PO-00001' }
  });
  if (!order) {
    console.log('PO-00001 not found');
    return;
  }
  
  const orderDate = order.date ? new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
  const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
  
  console.log('Formatted Dates:');
  console.log('orderDate:', orderDate);
  console.log('deliveryDate:', deliveryDate);
  process.exit(0);
}

test();
