const { 
  SalesOrder, SalesOrderItem, Ledger, Item, Group, 
  SalesInvoice, SalesInvoiceItem, sequelize 
} = require('../../models');
const AccountingService = require('../../services/AccountingService');

exports.createOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { 
      companyId, customerId, orderNumber, referenceNumber, date, 
      expectedShipmentDate, paymentTerms, deliveryMethod, salesperson, 
      customerNotes, termsConditions, subTotal, discount, tax, taxPercent,
      adjustment, totalAmount, status, items, attachments, projectId 
    } = req.body;

    const order = await SalesOrder.create({
      CompanyId: companyId,
      LedgerId: customerId,
      orderNumber,
      referenceNumber,
      date,
      expectedShipmentDate: expectedShipmentDate || null,
      paymentTerms,
      deliveryMethod,
      salesperson,
      customerNotes,
      termsConditions,
      subTotal,
      discount,
      tax,
      taxPercent: parseFloat(taxPercent || 0),
      adjustment,
      totalAmount,
      status: status || 'Draft',
      attachments,
      ProjectId: projectId || null
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
    next(err);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const orders = await SalesOrder.findAll({
      where: { CompanyId: companyId },
      include: [
        { model: Ledger, as: 'Customer', attributes: ['name', 'currency', 'state', 'gstNumber', 'billingAddress', 'shippingAddress'] },
        { model: SalesOrderItem, as: 'Items' }
      ],
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

exports.updateOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { orderId } = req.params;
    const { 
      customerId, orderNumber, referenceNumber, date, 
      expectedShipmentDate, paymentTerms, deliveryMethod, salesperson, 
      customerNotes, termsConditions, subTotal, discount, tax, taxPercent,
      adjustment, totalAmount, status, items, attachments, projectId
    } = req.body;

    const order = await SalesOrder.findByPk(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    // BOLA guard: the requesting company must own this order
    const requestingCompanyId = req.body.companyId || req.user?.CompanyId;
    if (requestingCompanyId && String(order.CompanyId) !== String(requestingCompanyId)) {
      await t.rollback();
      return res.status(403).json({ error: 'Access denied' });
    }

    await order.update({
      LedgerId: customerId,
      orderNumber,
      referenceNumber,
      date,
      expectedShipmentDate: expectedShipmentDate || null,
      paymentTerms,
      deliveryMethod,
      salesperson,
      customerNotes,
      termsConditions,
      subTotal,
      discount,
      tax,
      taxPercent: taxPercent !== undefined ? parseFloat(taxPercent || 0) : order.taxPercent,
      adjustment,
      totalAmount,
      status: status || order.status,
      attachments,
      ProjectId: projectId || null
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
    next(err);
  }
};

exports.createInvoice = async (req, res, next) => {
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
      ProjectId: projectId || null
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
      }, t);
      await invoice.update({ VoucherId: accountingResult.voucherId, status: 'Confirmed' }, { transaction: t });
    }

    await t.commit();
    res.status(201).json(invoice);
  } catch (err) {
    if (t) await t.rollback();
    next(err);
  }
};

exports.getInvoicesByCompany = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const invoices = await SalesInvoice.findAll({
      where: { CompanyId: companyId },
      include: [
        { model: Ledger, as: 'CustomerLedger', attributes: ['name', 'currency'] }
      ],
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(invoices);
  } catch (err) {
    next(err);
  }
};

exports.getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { InvoicePayment, PaymentTransaction } = require('../../models');
    const invoice = await SalesInvoice.findByPk(id, {
      include: [
        { model: SalesInvoiceItem, as: 'items', include: [{ model: Item }] },
        { model: Ledger, as: 'CustomerLedger', attributes: ['name', 'email', 'billingAddress', 'address', 'currency'] },
        { model: InvoicePayment, as: 'payments', include: [{ model: PaymentTransaction }] }
      ]
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    next(err);
  }
};

exports.updateInvoice = async (req, res, next) => {
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
    // BOLA guard: the requesting company must own this invoice
    const requestingCompanyId = req.body.companyId || req.user?.CompanyId;
    if (requestingCompanyId && String(invoice.CompanyId) !== String(requestingCompanyId)) {
      await t.rollback();
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update main record
    await invoice.update({
      customerLedgerId: customerLedgerId !== undefined ? customerLedgerId : invoice.customerLedgerId,
      invoiceNumber: invoiceNumber !== undefined ? invoiceNumber : invoice.invoiceNumber,
      date: date !== undefined ? date : invoice.date,
      dueDate: dueDate !== undefined ? dueDate : invoice.dueDate,
      orderNumber: orderNumber !== undefined ? orderNumber : invoice.orderNumber,
      terms: terms !== undefined ? terms : invoice.terms,
      salesperson: salesperson !== undefined ? salesperson : invoice.salesperson,
      subject: subject !== undefined ? subject : invoice.subject,
      subTotal: subTotal !== undefined ? subTotal : invoice.subTotal,
      discountAmount: discountAmount !== undefined ? discountAmount : invoice.discountAmount,
      gstAmount: gstAmount !== undefined ? gstAmount : invoice.gstAmount,
      adjustment: adjustment !== undefined ? adjustment : invoice.adjustment,
      totalAmount: totalAmount !== undefined ? totalAmount : invoice.totalAmount,
      status: status !== undefined ? status : invoice.status,
      customerNotes: customerNotes !== undefined ? customerNotes : invoice.customerNotes,
      termsConditions: termsConditions !== undefined ? termsConditions : invoice.termsConditions,
      balance: totalAmount !== undefined ? (parseFloat(totalAmount) - parseFloat(invoice.amountPaid || 0)) : invoice.balance,
      ProjectId: projectId !== undefined ? (projectId || null) : invoice.ProjectId
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
      }, t);
      await invoice.update({ VoucherId: accountingResult.voucherId, status: 'Confirmed' }, { transaction: t });
    }

    await t.commit();
    res.json(invoice);
  } catch (err) {
    if (t) await t.rollback();
    next(err);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const requestingCompanyId = req.query.companyId || req.user?.CompanyId;
    const order = await SalesOrder.findByPk(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    // BOLA guard
    if (requestingCompanyId && String(order.CompanyId) !== String(requestingCompanyId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await SalesOrder.destroy({ where: { id: orderId } });
    res.json({ message: 'Sales Order deleted.' });
  } catch (err) {
    next(err);
  }
};

exports.deleteInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requestingCompanyId = req.query.companyId || req.user?.CompanyId;
    const invoice = await SalesInvoice.findByPk(id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    // BOLA guard
    if (requestingCompanyId && String(invoice.CompanyId) !== String(requestingCompanyId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await SalesInvoice.destroy({ where: { id } });
    res.json({ message: 'Invoice deleted.' });
  } catch (err) {
    next(err);
  }
};

exports.getOpenInvoices = async (req, res, next) => {
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
    next(err);
  }
};

exports.recordPayment = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { companyId, customerId, paymentDate, amount, depositToId, reference, invoices, projectId, paymentMode } = req.body;
    // invoices: [{ id, amountToApply }]

    // 1. Create Receipt Voucher
    const voucher = await AccountingService.recordJournalEntry({
      companyId,
      date: paymentDate,
      voucherType: 'Receipt',
      narration: `Payment received from customer via ${paymentMode || 'Bank Transfer'}. Ref: ${reference || 'N/A'}`,
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
    next(err);
  }
};

exports.applyCredit = async (req, res, next) => {
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
    next(err);
  }
};


exports.getNextNumber = async (req, res, next) => {
  try {
    const { companyId, type } = req.params;
    const models = require('../../models');
    let model;
    let prefix;
    let field;

    switch (type) {
      case 'invoice':
        model = models.SalesInvoice;
        prefix = 'INV-';
        field = 'invoiceNumber';
        break;
      case 'order':
        model = models.SalesOrder;
        prefix = 'SO-';
        field = 'orderNumber';
        break;
      case 'quote':
        model = models.Quote;
        prefix = 'QT-';
        field = 'quoteNumber';
        break;
      case 'credit-note':
        model = models.CreditNote;
        prefix = 'CN-';
        field = 'creditNoteNumber';
        break;
      case 'challan':
        model = models.DeliveryChallan;
        prefix = 'DC-';
        field = 'challanNumber';
        break;
      default:
        return res.status(400).json({ error: 'Invalid document type' });
    }

    const lastDoc = await model.findOne({
      where: { CompanyId: companyId },
      order: [['createdAt', 'DESC']]
    });

    if (!lastDoc || !lastDoc[field]) {
      return res.json({ nextNumber: `${prefix}000001` });
    }

    const lastNumber = lastDoc[field];
    const match = lastNumber.match(/(\d+)/);
    if (match) {
      const numStr = match[0];
      const num = parseInt(numStr);
      const nextNum = (num + 1).toString().padStart(numStr.length, '0');
      const nextNumber = lastNumber.replace(numStr, nextNum);
      return res.json({ nextNumber });
    }

    res.json({ nextNumber: lastNumber + '-001' });
  } catch (err) {
    next(err);
  }
};

exports.getPublicInvoiceByShareToken = async (req, res, next) => {
  try {
    const { share_token } = req.params;
    const { Op } = require('sequelize');
    const { Company } = require('../../models');

    const invoice = await SalesInvoice.findOne({
      where: {
        shareToken: share_token,
        shareExpiresAt: { [Op.gt]: new Date() }
      },
      include: [
        { model: SalesInvoiceItem, as: 'items', include: [{ model: Item }] },
        { model: Ledger, as: 'CustomerLedger', attributes: ['name', 'displayName', 'email', 'billingAddress', 'address', 'currency', 'mobile', 'workPhone'] },
        { model: Company, attributes: ['name', 'gstNumber', 'address', 'email', 'state'] }
      ]
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found or link has expired.' });
    }

    // Self-healing payment link generation on-the-fly
    if (!invoice.paymentLink && parseFloat(invoice.balance || invoice.totalAmount) > 0) {
      const PaymentService = require('../../services/PaymentService');
      try {
        const linkResult = await PaymentService.generateInvoicePaymentLink(invoice.id, invoice.CompanyId);
        invoice.paymentLink = linkResult.paymentLink;
      } catch (err) {
        console.warn('Failed to auto-generate link during public fetch:', err.message);
      }
    }

    res.json(invoice);
  } catch (err) {
    next(err);
  }
};

exports.triggerReminders = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const ReminderService = require('../../services/ReminderService');
    const result = await ReminderService.processPaymentReminders(companyId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
