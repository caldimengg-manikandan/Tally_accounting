const { SalesOrder, SalesOrderItem, Ledger, Item, sequelize } = require('./models');

async function testCreate() {
  console.log('Testing sales order creation...');
  const t = await sequelize.transaction();
  try {
    // Let's find a company and a customer ledger
    const ledger = await Ledger.findOne();
    if (!ledger) {
      console.log('No ledger found! Please make sure database is initialized.');
      return;
    }
    const item = await Item.findOne();
    if (!item) {
      console.log('No item found!');
    }

    const payload = {
      companyId: ledger.CompanyId,
      customerId: ledger.id,
      orderNumber: 'SO-TEST-' + Date.now(),
      referenceNumber: 'REF-123',
      date: new Date().toISOString().split('T')[0],
      expectedShipmentDate: '', // Empty string to test the issue
      paymentTerms: 'Due on Receipt',
      deliveryMethod: '',
      salesperson: '',
      customerNotes: 'test notes',
      termsConditions: 'test terms',
      subTotal: 100,
      discount: 0,
      tax: 18,
      adjustment: 0,
      totalAmount: 118,
      status: 'Draft',
      projectId: '', // Empty string to test
      items: item ? [{
        itemId: item.id,
        quantity: 1,
        rate: 100,
        amount: 100,
        detail: item.name
      }] : []
    };

    console.log('Payload:', payload);

    // Call the same code as createOrder
    const order = await SalesOrder.create({
      CompanyId: payload.companyId,
      LedgerId: payload.customerId,
      orderNumber: payload.orderNumber,
      referenceNumber: payload.referenceNumber,
      date: payload.date,
      expectedShipmentDate: payload.expectedShipmentDate || null,
      paymentTerms: payload.paymentTerms,
      deliveryMethod: payload.deliveryMethod,
      salesperson: payload.salesperson,
      customerNotes: payload.customerNotes,
      termsConditions: payload.termsConditions,
      subTotal: payload.subTotal,
      discount: payload.discount,
      tax: payload.tax,
      adjustment: payload.adjustment,
      totalAmount: payload.totalAmount,
      status: payload.status || 'Draft',
      attachments: payload.attachments,
      ProjectId: payload.projectId || null
    }, { transaction: t });

    if (payload.items && payload.items.length > 0) {
      const validItems = payload.items.filter(it => it.itemId && it.itemId !== '');
      const orderItems = validItems.map(it => {
        const { id, ...itemData } = it;
        return {
          ...itemData,
          ItemId: it.itemId,
          SalesOrderId: order.id,
          amount: (it.quantity || 0) * (it.rate || 0)
        };
      });
      if (orderItems.length > 0) {
        await SalesOrderItem.bulkCreate(orderItems, { transaction: t });
      }
    }

    await t.commit();
    console.log('✅ Success! Sales order created successfully. ID:', order.id);
  } catch (err) {
    if (t) await t.rollback();
    console.error('❌ Failed with error:', err);
  } finally {
    await sequelize.close();
  }
}

testCreate();
