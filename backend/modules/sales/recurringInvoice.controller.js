const { RecurringInvoice, TaxInvoice, RetainerInvoice, Company, AuditLog, User } = require('../../models');
const AuditService = require('../../services/AuditService');
const moment = require('moment');

exports.create = async (req, res) => {
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
    res.status(500).json({ error: err.message });
  }
};

exports.getByCompany = async (req, res) => {
  try {
    const templates = await RecurringInvoice.findAll({
      where: { CompanyId: req.params.companyId },
      order: [['nextGenerationDate', 'ASC']]
    });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const template = await RecurringInvoice.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    
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
    res.status(500).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
   try {
     const template = await RecurringInvoice.findByPk(req.params.id);
     if (!template) return res.status(404).json({ error: 'Template not found' });
     await template.destroy();
     res.json({ message: 'Template deleted' });
   } catch (err) {
     res.status(500).json({ error: err.message });
   }
};

// Logic for generating invoices from templates
exports.processDueInvoices = async (req, res) => {
  try {
    const now = new Date();
    const templates = await RecurringInvoice.findAll({
      where: {
        status: 'Active',
        nextGenerationDate: { [require('sequelize').Op.lte]: now }
      }
    });

    const results = [];
    const { RetainerAdjustment, Transaction, Voucher, Ledger } = require('../../models');

    for (const template of templates) {
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
        });
      } else {
        // Find customer ledger ID from name (template should ideally have ledgerId)
        const { Ledger, SalesInvoice, SalesInvoiceItem } = require('../../models');
        const customer = await Ledger.findOne({ where: { name: template.customerName, CompanyId: template.CompanyId } });
        
        createdInvoice = await SalesInvoice.create({
          invoiceNumber: `RECUR-INV-${Date.now()}`,
          date: now,
          dueDate: moment().add(30, 'days').toDate(),
          customerLedgerId: customer?.id || null, // Best effort
          totalAmount: template.totalAmount,
          subTotal: template.subTotal,
          gstAmount: template.taxAmount,
          status: 'Sent', // Default to sent/active for recurring
          CompanyId: template.CompanyId,
          balance: template.totalAmount // Initialize balance
        });

        // Create line items for the invoice
        const items = JSON.parse(template.itemsJson || '[]');
        if (items.length > 0) {
          await SalesInvoiceItem.bulkCreate(items.map(it => ({
            ...it,
            SalesInvoiceId: createdInvoice.id,
            amount: it.quantity * it.rate
          })));
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
              order: [['invoiceDate', 'ASC']] // Apply oldest first
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
                  });

                  await availableRetainer.update({
                      amountUsed: parseFloat(availableRetainer.amountUsed) + amountToApply,
                      status: (parseFloat(availableRetainer.amountUsed) + amountToApply >= parseFloat(availableRetainer.totalAmount)) 
                              ? 'FullyApplied' : 'PartiallyApplied'
                  });

                  // Update invoice status if fully paid
                  if (amountToApply >= parseFloat(template.totalAmount)) {
                      await createdInvoice.update({ status: 'Paid' });
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

      await template.update(updateData);
      
      await AuditService.log({
        action: 'INSTANCE_GENERATED',
        tableName: 'RecurringInvoice',
        recordId: template.id,
        newData: { invoiceNumber: createdInvoice?.invoiceNumber, date: now },
        companyId: template.CompanyId,
        userId: null // System action
      });

      results.push({ template: template.templateName, invoice: createdInvoice?.invoiceNumber });
    }

    res.json({ message: `Processed ${templates.length} templates`, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getHistory = async (req, res) => {
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
    res.status(500).json({ error: err.message });
  }
};
