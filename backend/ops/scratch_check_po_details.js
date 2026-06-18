const { PurchaseOrder } = require('./models');

async function test() {
  try {
    const order = await PurchaseOrder.findOne({
      where: { orderNumber: 'PO-00001' }
    });
    if (order) {
      console.log('Purchase Order PO-00001 Details:');
      console.log('deliveryAddress:', order.deliveryAddress);
      console.log('deliveryAddressText:', order.deliveryAddressText);
      console.log('deliveryAddressDataJson:', order.deliveryAddressDataJson);
    } else {
      console.log('Order PO-00001 not found.');
    }
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

test();
