const { SalesOrder, SalesOrderItem, Ledger, Item, Group, sequelize } = require('../../models');
const AccountingService = require('../../services/AccountingService');

exports.createOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { 
      orderNumber, date, status, customerId, companyId,
      referenceNumber, expectedShipmentDate, paymentTerms, 
      deliveryMethod, salesperson, customerNotes, termsConditions,
      subTotal, discount, tax, adjustment, totalAmount, items
    } = req.body;

    const order = await SalesOrder.create({
      orderNumber,
      date: date || undefined,
      status: status || 'Draft',
      LedgerId: customerId || null,
      CompanyId: companyId,
      referenceNumber,
      expectedShipmentDate: expectedShipmentDate || null,
      paymentTerms,
      deliveryMethod,
      salesperson,
      customerNotes,
      termsConditions,
      subTotal,
      discount,
      tax,
      adjustment,
      totalAmount
    }, { transaction: t });

    if (items && items.length > 0) {
      const orderItems = items.map(({ id, ...item }) => ({
        ...item,
        SalesOrderId: order.id
      }));
      await SalesOrderItem.bulkCreate(orderItems, { transaction: t });
    }

    await t.commit();
    
    // Fetch complete order with items
    const completeOrder = await SalesOrder.findByPk(order.id, {
      include: [{ model: SalesOrderItem, as: 'Items' }]
    });

    res.status(201).json(completeOrder);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { companyId } = req.params;
    const orders = await SalesOrder.findAll({
      where: { CompanyId: companyId },
      include: [
        { model: Ledger, as: 'Customer', attributes: ['name'] },
        { model: SalesOrderItem, as: 'Items' }
      ],
      order: [['date', 'DESC']]
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { orderId } = req.params;
    const { 
      orderNumber, date, status, customerId,
      referenceNumber, expectedShipmentDate, paymentTerms, 
      deliveryMethod, salesperson, customerNotes, termsConditions,
      subTotal, discount, tax, adjustment, totalAmount, items
    } = req.body;
    
    const order = await SalesOrder.findByPk(orderId);
    if (!order) {
      await t.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }

    await order.update({
      orderNumber,
      date: date || null,
      status,
      LedgerId: customerId,
      referenceNumber,
      expectedShipmentDate: expectedShipmentDate || null,
      paymentTerms,
      deliveryMethod,
      salesperson,
      customerNotes,
      termsConditions,
      subTotal,
      discount,
      tax,
      adjustment,
      totalAmount
    }, { transaction: t });

    // Handle items: simple approach - delete all and recreate
    if (items) {
      await SalesOrderItem.destroy({ where: { SalesOrderId: orderId }, transaction: t });
      if (items.length > 0) {
        const orderItems = items.map(({ id, ...item }) => ({
          ...item,
          SalesOrderId: orderId
        }));
        await SalesOrderItem.bulkCreate(orderItems, { transaction: t });
      }
    }

    await t.commit();
    
    const updatedOrder = await SalesOrder.findByPk(orderId, {
      include: [{ model: SalesOrderItem, as: 'Items' }]
    });

    res.json(updatedOrder);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
};

exports.createInvoice = async (req, res) => {
  try {
    const { 
      companyId, customerLedgerId, date, narration, items 
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Invoice must have at least one item.' });
    }

    const result = await AccountingService.recordTaxInvoice({
      companyId,
      customerLedgerId,
      date,
      narration,
      items,
      type: 'Sales',
      userId: req.user?.id
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
