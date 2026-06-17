const { PurchaseOrder, Ledger, Company } = require('../../models');

exports.getPurchaseOrders = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const orders = await PurchaseOrder.findAll({
      where: { CompanyId: companyId },
      include: [{ model: Ledger, attributes: ['name'] }],
      order: [['date', 'DESC']]
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

exports.createPurchaseOrder = async (req, res, next) => {
  try {
    const { companyId, supplierLedgerId, date, orderNumber, totalAmount, notes, status, items } = req.body;
    const order = await PurchaseOrder.create({
      CompanyId: companyId,
      LedgerId: supplierLedgerId,
      date: date || new Date(),
      orderNumber: orderNumber || `PO-${Date.now()}`,
      totalAmount: totalAmount || 0,
      notes,
      status: status || 'Draft',
    });
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

exports.updatePurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await PurchaseOrder.findByPk(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    await order.update(req.body);
    res.json(order);
  } catch (err) {
    next(err);
  }
};

exports.deletePurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await PurchaseOrder.findByPk(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    await order.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};
