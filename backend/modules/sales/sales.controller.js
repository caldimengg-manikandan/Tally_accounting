const { SalesOrder, Ledger, Group } = require('../../models');
const AccountingService = require('../../services/AccountingService');

exports.createOrder = async (req, res) => {
  try {
    const { orderNumber, date, status, totalAmount, notes, customerId, companyId } = req.body;
    const order = await SalesOrder.create({
      orderNumber,
      date: date || undefined,
      status,
      totalAmount,
      notes,
      LedgerId: customerId || null,
      CompanyId: companyId
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { companyId } = req.params;
    const orders = await SalesOrder.findAll({
      where: { CompanyId: companyId },
      include: [{ model: Ledger, attributes: ['name'] }],
      order: [['date', 'DESC']]
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, totalAmount, notes } = req.body;
    
    const order = await SalesOrder.findByPk(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const previousStatus = order.status;
    await order.update({ status, totalAmount, notes });

    // In a strict accounting system, Sales Orders do not generate Journal Vouchers.
    // Financial entries are only created when the Sales Invoice is posted.
    // Order status is now successfully updated.

    res.json(order);
  } catch (err) {
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

    console.log('✅ Invoice Posted Successfully:', result.voucher.voucherNumber);
    res.status(201).json(result);
  } catch (err) {
    console.error('❌ INVOICE CONTROLLER ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
};
