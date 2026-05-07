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
      adjustment, totalAmount, status, items, attachments, projectId 
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
      status: status || 'Draft',
      attachments,
      ProjectId: projectId
    }, { transaction: t });

    if (items && items.length > 0) {
      const validItems = items.filter(it => it.itemId && it.itemId !== '');
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
      adjustment, totalAmount, status, items, attachments, projectId
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
      status: status || order.status,
      attachments,
      ProjectId: projectId
    }, { transaction: t });

    if (items) {
      await SalesOrderItem.destroy({ where: { SalesOrderId: orderId }, transaction: t });
      const validItems = items.filter(it => it.itemId && it.itemId !== '');
      const orderItems = validItems.map(it => {
        const { id, ...itemData } = it;
        return {
          ...itemData,
          ItemId: it.itemId,
          SalesOrderId: orderId,
          amount: (it.quantity || 0) * (it.rate || 0)
        };
      });
      if (orderItems.length > 0) {
        await SalesOrderItem.bulkCreate(orderItems, { transaction: t });
      }
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
      customerNotes, termsConditions, status, items, projectId 
    } = req.body;

    // 1. Create the persistent invoice record (Draft or Confirmed)
    const invoice = await SalesInvoice.create({
      CompanyId: companyId, customerLedgerId, invoiceNumber, date, dueDate,
      orderNumber, terms, salesperson, subject, subTotal, 
      discountAmount, gstAmount, adjustment, totalAmount,
      customerNotes, termsConditions, status: status || 'Draft',
      balance: totalAmount, // Initialize balance
      ProjectId: projectId
    }, { transaction: t });

    // 2. Create line items
    if (items && items.length > 0) {
      const validItems = items.filter(it => it.itemId && it.itemId !== '');
      const invoiceItems = validItems.map(it => {
        const { id, ...itemData } = it;
        return {
          ...itemData,
          SalesInvoiceId: invoice.id,
          amount: (it.quantity || 0) * (it.rate || 0)
        };
      });
      if (invoiceItems.length > 0) {
        await SalesInvoiceItem.bulkCreate(invoiceItems, { transaction: t });
      }
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
        userId: req.user?.id,
        projectId
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
      include: [
        { model: SalesInvoiceItem, as: 'items', include: [{ model: Item }] },
        { model: Ledger, as: 'CustomerLedger', attributes: ['name', 'email', 'billingAddress', 'address'] }
      ]
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
      customerNotes, termsConditions, status, items, projectId 
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
      customerNotes, termsConditions, status,
      balance: totalAmount - (invoice.amountPaid || 0), // Recalculate balance
      ProjectId: projectId
    }, { transaction: t });

    // Update items
    if (items) {
      await SalesInvoiceItem.destroy({ where: { SalesInvoiceId: id }, transaction: t });
      const validItems = items.filter(it => it.itemId && it.itemId !== '');
      const invoiceItems = validItems.map(it => {
        const { id: lineItemId, ...itemData } = it;
        return {
          ...itemData,
          SalesInvoiceId: id,
          amount: (it.quantity || 0) * (it.rate || 0)
        };
      });
      if (invoiceItems.length > 0) {
        await SalesInvoiceItem.bulkCreate(invoiceItems, { transaction: t });
      }
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
        userId: req.user?.id,
        projectId
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

exports.getOpenInvoices = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { Op } = require('sequelize');
    const invoices = await SalesInvoice.findAll({
      where: { 
        customerLedgerId: customerId,
        balance: { [Op.gt]: 0 },
        status: { [Op.notIn]: ['Draft', 'Void'] }
      },
      order: [['date', 'ASC']]
    });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.recordPayment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { companyId, customerId, paymentDate, amount, depositToId, reference, invoices, projectId } = req.body;
    // invoices: [{ id, amountToApply }]

    // 1. Create Receipt Voucher
    const voucher = await AccountingService.recordJournalEntry({
      companyId,
      date: paymentDate,
      voucherType: 'Receipt',
      narration: `Payment received from customer. Ref: ${reference || 'N/A'}`,
      reference,
      entries: [
        { ledgerId: depositToId, debit: amount, credit: 0 }, // Bank/Cash (Debit)
        { ledgerId: customerId, debit: 0, credit: amount }  // Accounts Receivable (Credit)
      ],
      userId: req.user?.id,
      projectId
    }, t);

    // 2. Apply to Invoices
    if (invoices && Array.isArray(invoices)) {
        for (const inv of invoices) {
          const invoice = await SalesInvoice.findByPk(inv.id, { transaction: t });
          if (invoice) {
            const newPaid = parseFloat(invoice.amountPaid || 0) + parseFloat(inv.amountToApply);
            const newBalance = parseFloat(invoice.totalAmount) - newPaid;
            let status = invoice.status;
            if (newBalance <= 0) status = 'Paid';
            else if (newPaid > 0) status = 'Partially Paid';

            await invoice.update({ amountPaid: newPaid, balance: newBalance, status }, { transaction: t });
          }
        }
    }

    await t.commit();
    res.json({ message: 'Payment recorded successfully', voucher });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ error: err.message });
  }
};

exports.applyCredit = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { companyId, customerId, sourceId, sourceType, invoices } = req.body;
    // sourceType: 'Retainer' or 'CreditNote'
    // invoices: [{ id, amountToApply }]

    const { RetainerInvoice, CreditNote, RetainerAdjustment } = require('../../models');

    for (const inv of invoices) {
      // 1. Update Invoice
      const invoice = await SalesInvoice.findByPk(inv.id, { transaction: t });
      if (invoice) {
        const newPaid = parseFloat(invoice.amountPaid || 0) + parseFloat(inv.amountToApply);
        const newBalance = parseFloat(invoice.totalAmount) - newPaid;
        let status = invoice.status;
        if (newBalance <= 0) status = 'Paid';
        else if (newPaid > 0) status = 'Partially Paid';

        await invoice.update({ amountPaid: newPaid, balance: newBalance, status }, { transaction: t });

        // 2. Update Source Credit
        if (sourceType === 'Retainer') {
          const retainer = await RetainerInvoice.findByPk(sourceId, { transaction: t });
          const newUsed = parseFloat(retainer.amountUsed || 0) + parseFloat(inv.amountToApply);
          let retStatus = retainer.status;
          if (newUsed >= parseFloat(retainer.amountReceived || 0)) retStatus = 'FullyApplied';
          else if (newUsed > 0) retStatus = 'PartiallyApplied';

          await retainer.update({ amountUsed: newUsed, status: retStatus }, { transaction: t });

          // 3. Create Adjustment Record
          await RetainerAdjustment.create({
            RetainerInvoiceId: sourceId,
            InvoiceId: inv.id,
            amountToAdjust: inv.amountToApply,
            CompanyId: companyId
          }, { transaction: t });
        }
      }
    }

    await t.commit();
    res.json({ message: 'Credit applied successfully' });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ error: err.message });
  }
};

