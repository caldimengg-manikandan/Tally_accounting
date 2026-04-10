const { 
  SalesOrder, SalesOrderItem, Ledger, Item, Group, 
  SalesInvoice, SalesInvoiceItem, sequelize 
} = require('../../models');
const AccountingService = require('../../services/AccountingService');

exports.createOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { 
      companyId, customerId, orderNumber, referenceNumber, date, 
      expectedShipmentDate, paymentTerms, deliveryMethod, salesperson, 
      customerNotes, termsConditions, subTotal, discount, tax, 
      adjustment, totalAmount, status, items 
    } = req.body;

    const order = await SalesOrder.create({
      CompanyId: companyId,
      LedgerId: customerId,
      orderNumber,
      referenceNumber,
      date,
      expectedShipmentDate,
      paymentTerms,
      deliveryMethod,
      salesperson,
      customerNotes,
      termsConditions,
      subTotal,
      discount,
      tax,
      adjustment,
      totalAmount,
      status: status || 'Draft'
    }, { transaction: t });

    if (items && items.length > 0) {
      const orderItems = items.map(it => ({
        ...it,
        SalesOrderId: order.id,
        amount: (it.quantity || 0) * (it.rate || 0)
      }));
      await SalesOrderItem.bulkCreate(orderItems, { transaction: t });
    }

    await t.commit();
    res.status(201).json(order);
  } catch (err) {
    if (t) await t.rollback();
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
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
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
      customerId, orderNumber, referenceNumber, date, 
      expectedShipmentDate, paymentTerms, deliveryMethod, salesperson, 
      customerNotes, termsConditions, subTotal, discount, tax, 
      adjustment, totalAmount, status, items 
    } = req.body;

    const order = await SalesOrder.findByPk(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    await order.update({
      LedgerId: customerId,
      orderNumber,
      referenceNumber,
      date,
      expectedShipmentDate,
      paymentTerms,
      deliveryMethod,
      salesperson,
      customerNotes,
      termsConditions,
      subTotal,
      discount,
      tax,
      adjustment,
      totalAmount,
      status
    }, { transaction: t });

    if (items) {
      await SalesOrderItem.destroy({ where: { SalesOrderId: orderId }, transaction: t });
      const orderItems = items.map(it => ({
        ...it,
        SalesOrderId: orderId,
        amount: (it.quantity || 0) * (it.rate || 0)
      }));
      await SalesOrderItem.bulkCreate(orderItems, { transaction: t });
    }

    await t.commit();
    res.json(order);
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ error: err.message });
  }
};

exports.createInvoice = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { 
      companyId, customerLedgerId, invoiceNumber, date, dueDate, 
      orderNumber, terms, salesperson, subject, subTotal, 
      discountAmount, gstAmount, adjustment, totalAmount, 
      customerNotes, termsConditions, status, items 
    } = req.body;

    // 1. Create the persistent invoice record (Draft or Confirmed)
    const invoice = await SalesInvoice.create({
      CompanyId: companyId, customerLedgerId, invoiceNumber, date, dueDate,
      orderNumber, terms, salesperson, subject, subTotal, 
      discountAmount, gstAmount, adjustment, totalAmount,
      customerNotes, termsConditions, status: status || 'Draft'
    }, { transaction: t });

    // 2. Create line items
    if (items && items.length > 0) {
      const invoiceItems = items.map(it => ({
        ...it,
        SalesInvoiceId: invoice.id,
        amount: it.quantity * it.rate
      }));
      await SalesInvoiceItem.bulkCreate(invoiceItems, { transaction: t });
    }

    // 3. If "Confirmed", record in accounts
    if (status === 'Confirmed') {
      const accountingResult = await AccountingService.recordTaxInvoice({
        companyId,
        customerLedgerId,
        date,
        narration: subject || `Invoice ${invoiceNumber}`,
        items,
        type: 'Sales',
        userId: req.user?.id
      });
      await invoice.update({ VoucherId: accountingResult.voucherId, status: 'Sent' }, { transaction: t });
    }

    await t.commit();
    res.status(201).json(invoice);
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ error: err.message });
  }
};

exports.getInvoicesByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const invoices = await SalesInvoice.findAll({
      where: { CompanyId: companyId },
      include: [
        { model: Ledger, as: 'CustomerLedger', attributes: ['name'] }
      ],
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await SalesInvoice.findByPk(id, {
      include: [{ model: SalesInvoiceItem, as: 'items' }]
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateInvoice = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { 
      customerLedgerId, invoiceNumber, date, dueDate, 
      orderNumber, terms, salesperson, subject, subTotal, 
      discountAmount, gstAmount, adjustment, totalAmount, 
      customerNotes, termsConditions, status, items 
    } = req.body;

    const invoice = await SalesInvoice.findByPk(id);
    if (!invoice) {
        await t.rollback();
        return res.status(404).json({ error: 'Invoice not found' });
    }

    // Update main record
    await invoice.update({
      customerLedgerId, invoiceNumber, date, dueDate,
      orderNumber, terms, salesperson, subject, subTotal, 
      discountAmount, gstAmount, adjustment, totalAmount,
      customerNotes, termsConditions, status
    }, { transaction: t });

    // Update items
    if (items) {
      await SalesInvoiceItem.destroy({ where: { SalesInvoiceId: id }, transaction: t });
      const invoiceItems = items.map(it => ({
        ...it,
        SalesInvoiceId: id,
        amount: it.quantity * it.rate
      }));
      await SalesInvoiceItem.bulkCreate(invoiceItems, { transaction: t });
    }

    // If changing from Draft to Confirmed, record in accounts
    if (status === 'Confirmed' && !invoice.VoucherId) {
      const accountingResult = await AccountingService.recordTaxInvoice({
        companyId: invoice.CompanyId,
        customerLedgerId,
        date,
        narration: subject || `Invoice ${invoiceNumber}`,
        items,
        type: 'Sales',
        userId: req.user?.id
      });
      await invoice.update({ VoucherId: accountingResult.voucherId, status: 'Sent' }, { transaction: t });
    }

    await t.commit();
    res.json(invoice);
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ error: err.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    await SalesOrder.destroy({ where: { id: orderId } });
    res.json({ message: 'Sales Order deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    await SalesInvoice.destroy({ where: { id } });
    res.json({ message: 'Invoice deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
