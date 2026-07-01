const { RecurringInvoice, TaxInvoice, RetainerInvoice, Company, AuditLog, User, sequelize } = require('../../models');
const AuditService = require('../../services/AuditService');
const AccountingService = require('../../services/AccountingService');
const moment = require('moment');

exports.create = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.items && Array.isArray(data.items)) {
      data.itemsJson = JSON.stringify(data.items);
    }
    
    // Calculate first nextGenerationDate if not provided
    if (!data.nextGenerationDate) {
      data.nextGenerationDate = data.startDate;
    }
    
    const template = await RecurringInvoice.create(data);

    await AuditService.log({
      action: 'RECURRING_CREATED',
      tableName: 'RecurringInvoice',
      recordId: template.id,
      newData: template,
      companyId: data.CompanyId,
      userId: req.user.id,
      req
    });

    res.status(201).json(template);
  } catch (err) {
    next(err);
  }
};

exports.getByCompany = async (req, res, next) => {
  try {
    const templates = await RecurringInvoice.findAll({
      where: { CompanyId: req.params.companyId },
      order: [['nextGenerationDate', 'ASC']]
    });
    res.json(templates);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const template = await RecurringInvoice.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    
    // BOLA guard
    const requestingCompanyId = req.query.companyId || req.user?.CompanyId;
    if (requestingCompanyId && String(template.CompanyId) !== String(requestingCompanyId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const templateObj = template.toJSON();
    
    // Convert itemsJson to items array for frontend compatibility
    try {
      if (templateObj.itemsJson) {
        templateObj.items = JSON.parse(templateObj.itemsJson);
      } else {
        templateObj.items = [];
      }
    } catch (e) {
      console.error("Failed to parse itemsJson:", e);
      templateObj.items = [];
    }
    
    res.json(templateObj);
  } catch (err) {
    console.error("Error in getById:", err);
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const template = await RecurringInvoice.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    
    // BOLA guard
    const requestingCompanyId = req.body.CompanyId || req.body.companyId || req.user?.CompanyId;
    if (requestingCompanyId && String(template.CompanyId) !== String(requestingCompanyId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const data = { ...req.body };
    if (data.items && Array.isArray(data.items)) {
      data.itemsJson = JSON.stringify(data.items);
    }
    
    const oldData = { ...template.dataValues };
    await template.update(data);

    await AuditService.log({
      action: 'RECURRING_UPDATED',
      tableName: 'RecurringInvoice',
      recordId: template.id,
      oldData,
      newData: template,
      companyId: template.CompanyId,
      userId: req.user.id,
      req
    });

    res.json(template);
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
   try {
     const template = await RecurringInvoice.findByPk(req.params.id);
     if (!template) return res.status(404).json({ error: 'Template not found' });

     // BOLA guard
     const requestingCompanyId = req.query.companyId || req.user?.CompanyId;
     if (requestingCompanyId && String(template.CompanyId) !== String(requestingCompanyId)) {
       return res.status(403).json({ error: 'Access denied' });
     }

     const oldData = { ...template.dataValues };
     const companyId = template.CompanyId;
     await template.destroy();

     await AuditService.log({
       action: 'RECURRING_DELETED',
       tableName: 'RecurringInvoice',
       recordId: template.id,
       oldData,
       companyId: companyId,
       userId: req.user.id,
       req
     });

     res.json({ message: 'Template deleted' });
   } catch (err) {
     next(err);
   }
};

// Logic for generating invoices from templates
exports.processDueInvoices = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const now = new Date();
    const templates = await RecurringInvoice.findAll({
      where: {
        status: 'Active',
        nextGenerationDate: { [require('sequelize').Op.lte]: now }
      },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    const results = [];
    const { RetainerAdjustment, Transaction, Voucher, Ledger } = require('../../models');

    for (const template of templates) {
      // Double check lock / idempotency check:
      // Verify that the template is still active and the nextGenerationDate is still in the past.
      if (template.status !== 'Active' || (template.nextGenerationDate && new Date(template.nextGenerationDate) > now)) {
        continue;
      }
      // Create actual invoice
      const invoiceData = {
        invoiceNumber: `RECUR-${Date.now()}`,
        invoiceDate: now,
        customerName: template.customerName,
        itemsJson: template.itemsJson,
        totalAmount: template.totalAmount,
        subTotal: template.subTotal,
        taxAmount: template.taxAmount,
        discount: template.discount,
        status: 'Draft',
        CompanyId: template.CompanyId,
        isRecurringInstance: true,
        templateId: template.id
      };

      let createdInvoice;
      if (template.invoiceType === 'RetainerInvoice') {
        createdInvoice = await RetainerInvoice.create({
          invoiceNumber: `RECUR-RET-${Date.now()}`,
          invoiceDate: now,
          customerName: template.customerName,
          itemsJson: template.itemsJson,
          totalAmount: template.totalAmount,
          status: 'Draft',
          CompanyId: template.CompanyId
        }, { transaction: t });
      } else {
        // Find customer ledger ID from name (template should ideally have ledgerId)
        const { Ledger, SalesInvoice, SalesInvoiceItem } = require('../../models');
        const customer = await Ledger.findOne({ 
          where: { name: template.customerName, CompanyId: template.CompanyId },
          transaction: t
        });
        
        createdInvoice = await SalesInvoice.create({
          invoiceNumber: `RECUR-INV-${Date.now()}`,
          date: now,
          dueDate: moment().add(30, 'days').toDate(),
          customerLedgerId: customer?.id || null, // Best effort
          totalAmount: template.totalAmount,
          subTotal: template.subTotal,
          gstAmount: template.taxAmount,
          status: 'Confirmed', // Default to confirmed/active for recurring, shows as Draft in UI
          CompanyId: template.CompanyId,
          balance: template.totalAmount // Initialize balance
        }, { transaction: t });

        // Create line items for the invoice
        const items = JSON.parse(template.itemsJson || '[]');
        const validItems = items.filter(it => it.itemId && it.itemId !== '');
        if (validItems.length > 0) {
          await SalesInvoiceItem.bulkCreate(validItems.map(it => {
            const { id, ...itemData } = it; // Strip IDs from template items
            return {
              ...itemData,
              SalesInvoiceId: createdInvoice.id,
              amount: it.quantity * it.rate
            };
          }), { transaction: t });

          // Trigger Accounting Logic & Update VoucherId link
          const accountingResult = await AccountingService.recordTaxInvoice({
            companyId: template.CompanyId,
            customerLedgerId: customer?.id,
            date: now,
            narration: `Recurring Invoice ${createdInvoice.invoiceNumber}`,
            items: validItems,
            type: 'Sales',
            userId: null // System generated
          }, t);
          if (accountingResult && accountingResult.voucher) {
            await createdInvoice.update({ VoucherId: accountingResult.voucher.id }, { transaction: t });
          }
        }
      }

      // AUTO-APPLY RETAINER LOGIC
      // If template has autoApplyRetainer (need to add this field or assume true for now)
      if (createdInvoice) {
          const availableRetainer = await RetainerInvoice.findOne({
              where: {
                  customerName: template.customerName,
                  status: ['Paid', 'PartiallyApplied'],
                  CompanyId: template.CompanyId
              },
              order: [['invoiceDate', 'ASC']], // Apply oldest first
              transaction: t
          });

          if (availableRetainer) {
              const balance = parseFloat(availableRetainer.amountReceived) - parseFloat(availableRetainer.amountUsed);
              const amountToApply = Math.min(balance, parseFloat(template.totalAmount));

              if (amountToApply > 0) {
                  await RetainerAdjustment.create({
                      RetainerInvoiceId: availableRetainer.id,
                      InvoiceId: createdInvoice.id,
                      amountToAdjust: amountToApply,
                      CompanyId: template.CompanyId
                  }, { transaction: t });

                  await availableRetainer.update({
                      amountUsed: parseFloat(availableRetainer.amountUsed) + amountToApply,
                      status: (parseFloat(availableRetainer.amountUsed) + amountToApply >= parseFloat(availableRetainer.totalAmount)) 
                              ? 'FullyApplied' : 'PartiallyApplied'
                  }, { transaction: t });

                  // Update invoice status if fully paid
                  if (amountToApply >= parseFloat(template.totalAmount)) {
                      await createdInvoice.update({ status: 'Paid' }, { transaction: t });
                  }
              }
          }
      }

      // Update next generation date
      let nextDate = moment(template.nextGenerationDate);
      if (template.frequency === 'Daily') nextDate.add(1, 'days');
      else if (template.frequency === 'Weekly') nextDate.add(1, 'weeks');
      else if (template.frequency === 'Monthly') nextDate.add(1, 'months');
      else if (template.frequency === 'Yearly') nextDate.add(1, 'years');

      const updateData = {
        lastGeneratedDate: now,
        nextGenerationDate: nextDate.toDate()
      };

      // Check for end date
      if (template.endDate && nextDate.isAfter(template.endDate)) {
        updateData.status = 'Expired';
      }

      await template.update(updateData, { transaction: t });
      
      await AuditService.log({
        action: 'INVOICE_GENERATED',
        tableName: 'RecurringInvoice',
        recordId: template.id,
        newData: { 
            message: `Generated Invoice ${createdInvoice?.invoiceNumber} from template`,
            invoiceNumber: createdInvoice?.invoiceNumber, 
            date: now 
        },
        companyId: template.CompanyId,
        userId: null // System action
      });

      results.push({ template: template.templateName, invoice: createdInvoice?.invoiceNumber });
    }

    await t.commit();
    res.json({ message: `Processed ${templates.length} templates`, results });
  } catch (err) {
    if (t) await t.rollback();
    console.error(err);
    next(err);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const logs = await AuditLog.findAll({
      where: {
        tableName: 'RecurringInvoice',
        recordId: req.params.id
      },
      include: [
        { model: User, as: 'User', attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
};

// ─── Get all child invoices generated from a recurring template ───────────────
exports.getChildInvoices = async (req, res, next) => {
  try {
    const { SalesInvoice, SalesInvoiceItem, Ledger } = require('../../models');
    const { Op } = require('sequelize');

    const template = await RecurringInvoice.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    // BOLA guard
    const requestingCompanyId = req.query.companyId || req.user?.CompanyId;
    if (requestingCompanyId && String(template.CompanyId) !== String(requestingCompanyId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find invoices linked by templateId field (set during processDueInvoices)
    // Also find by invoiceNumber pattern as fallback
    const invoices = await SalesInvoice.findAll({
      where: {
        CompanyId: template.CompanyId,
        [Op.or]: [
          { invoiceNumber: { [Op.like]: 'RECUR-INV-%' } },
        ]
      },
      include: [
        { model: SalesInvoiceItem, as: 'items' },
        { model: Ledger, as: 'CustomerLedger', attributes: ['name', 'email', 'workPhone', 'mobile'] }
      ],
      order: [['date', 'DESC']],
      limit: 50
    });

    // Filter to only those that match this customer
    const filtered = invoices.filter(inv => {
      const ledgerName = inv.CustomerLedger?.name || '';
      return ledgerName === template.customerName;
    });

    // Calculate unpaid total
    const unpaidTotal = filtered
      .filter(inv => !['Paid'].includes(inv.status))
      .reduce((sum, inv) => sum + parseFloat(inv.balance || 0), 0);

    res.json({ invoices: filtered, unpaidTotal });
  } catch (err) {
    console.error('getChildInvoices error:', err);
    next(err);
  }
};

// ─── Manually create one invoice from a template right now ───────────────────
exports.createManualInvoice = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { SalesInvoice, SalesInvoiceItem, Ledger } = require('../../models');

    const template = await RecurringInvoice.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    // BOLA guard
    const requestingCompanyId = req.body.CompanyId || req.body.companyId || req.user?.CompanyId;
    if (requestingCompanyId && String(template.CompanyId) !== String(requestingCompanyId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const now = new Date();

    // Find the customer ledger by name
    const customer = await Ledger.findOne({
      where: { name: template.customerName, CompanyId: template.CompanyId },
      transaction: t
    });

    const invoiceNumber = `RECUR-INV-MAN-${Date.now()}`;
    const createdInvoice = await SalesInvoice.create({
      invoiceNumber,
      date: now,
      dueDate: moment().add(30, 'days').toDate(),
      customerLedgerId: customer?.id || null,
      totalAmount: template.totalAmount,
      subTotal: template.subTotal,
      gstAmount: template.taxAmount,
      status: 'Draft',
      CompanyId: template.CompanyId,
      balance: template.totalAmount
    }, { transaction: t });

    const items = JSON.parse(template.itemsJson || '[]');
    const validItems = items.filter(it => it.itemId && it.itemId !== '');
    if (validItems.length > 0) {
      await SalesInvoiceItem.bulkCreate(validItems.map(it => {
        const { id, ...itemData } = it;
        return {
          ...itemData,
          SalesInvoiceId: createdInvoice.id,
          amount: it.quantity * it.rate
        };
      }), { transaction: t });
    }

    // Update template: increment manually created count, update last generated
    await template.update({
      lastGeneratedDate: now
    }, { transaction: t });

    await AuditService.log({
      action: 'INVOICE_GENERATED',
      tableName: 'RecurringInvoice',
      recordId: template.id,
      newData: {
        message: `Manually created invoice ${invoiceNumber} from template`,
        invoiceNumber,
        date: now
      },
      companyId: template.CompanyId,
      userId: req.user?.id
    });

    await t.commit();
    res.status(201).json({ message: 'Invoice created successfully', invoice: createdInvoice });
  } catch (err) {
    if (t) await t.rollback();
    console.error('createManualInvoice error:', err);
    next(err);
  }
};
