const { RecurringExpense, Voucher, Transaction, Ledger, Company, sequelize } = require('../../models');
const moment = require('moment');

exports.create = async (req, res, next) => {
  try {
    const data = { ...req.body };
    
    // Calculate first nextGenerationDate if not provided
    if (!data.nextGenerationDate) {
      data.nextGenerationDate = data.startDate;
    }
    
    const template = await RecurringExpense.create(data);
    res.status(201).json(template);
  } catch (err) {
    next(err);
  }
};

exports.getByCompany = async (req, res, next) => {
  try {
    const templates = await RecurringExpense.findAll({
      where: { CompanyId: req.params.companyId },
      include: [
        { model: Ledger, as: 'ExpenseAccount', attributes: ['name'] },
        { model: Ledger, as: 'PaidThrough', attributes: ['name'] },
        { model: Ledger, as: 'Vendor', attributes: ['name'] },
        { model: Ledger, as: 'Customer', attributes: ['name'] }
      ],
      order: [['nextGenerationDate', 'ASC']]
    });
    res.json(templates);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const template = await RecurringExpense.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    
    // BOLA guard
    const requestingCompanyId = req.body.CompanyId || req.body.companyId || req.user?.CompanyId;
    if (requestingCompanyId && String(template.CompanyId) !== String(requestingCompanyId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await template.update(req.body);
    res.json(template);
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const template = await RecurringExpense.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    // BOLA guard
    const requestingCompanyId = req.query.companyId || req.user?.CompanyId;
    if (requestingCompanyId && String(template.CompanyId) !== String(requestingCompanyId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await template.destroy();
    res.json({ message: 'Template deleted' });
  } catch (err) {
    next(err);
  }
};

exports.processDue = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const now = new Date();
    const templates = await RecurringExpense.findAll({
      where: {
        status: 'Active',
        nextGenerationDate: { [require('sequelize').Op.lte]: now }
      },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    const processed = [];

    for (const template of templates) {
      // Double check lock / idempotency check:
      // Verify that the template is still active and the nextGenerationDate is still in the past.
      if (template.status !== 'Active' || (template.nextGenerationDate && new Date(template.nextGenerationDate) > now)) {
        continue;
      }
      // 1. Create Voucher
      const voucher = await Voucher.create({
        voucherNumber: `EXP-REC-${Date.now()}`,
        voucherType: 'Payment',
        date: now,
        narration: JSON.stringify({
          notes: template.notes,
          isRecurring: true,
          templateId: template.id,
          vendor: template.vendorId ? (await Ledger.findByPk(template.vendorId))?.name : null,
          customer: template.customerId ? (await Ledger.findByPk(template.customerId))?.name : null
        }),
        CompanyId: template.CompanyId
      }, { transaction: t });

      // 2. Create Transactions (Double Entry)
      // Debit Expense Account
      await Transaction.create({
        VoucherId: voucher.id,
        LedgerId: template.expenseAccountId,
        amount: template.amount,
        type: 'Dr',
        CompanyId: template.CompanyId
      }, { transaction: t });

      // Credit Paid Through Account
      await Transaction.create({
        VoucherId: voucher.id,
        LedgerId: template.paidThroughId,
        amount: template.amount,
        type: 'Cr',
        CompanyId: template.CompanyId
      }, { transaction: t });

      // 3. Update template timing
      let nextDate = moment(template.nextGenerationDate);
      if (template.frequency === 'Daily') nextDate.add(1, 'days');
      else if (template.frequency === 'Weekly') nextDate.add(1, 'weeks');
      else if (template.frequency === 'Monthly') nextDate.add(1, 'months');
      else if (template.frequency === 'Yearly') nextDate.add(1, 'years');

      const updateData = {
        lastGeneratedDate: now,
        nextGenerationDate: nextDate.toDate()
      };

      if (template.endDate && nextDate.isAfter(template.endDate)) {
        updateData.status = 'Expired';
      }

      await template.update(updateData, { transaction: t });
      processed.push({ profile: template.profileName, voucher: voucher.voucherNumber });
    }

    await t.commit();
    res.json({ message: `Successfully processed ${processed.length} recurring expenses`, processed });
  } catch (err) {
    await t.rollback();
    console.error(err);
    next(err);
  }
};
