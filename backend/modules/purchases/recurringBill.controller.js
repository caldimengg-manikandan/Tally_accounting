const { RecurringBill, RecurringBillItem, Ledger, Company, Voucher, Transaction, sequelize } = require('../../models');
const moment = require('moment');

exports.create = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { items, companyId, ...rawBillData } = req.body;
    
    // Explicitly pick only the fields that exist in the RecurringBill model
    const billData = {
      profileName: rawBillData.profileName,
      repeatEvery: rawBillData.repeatEvery,
      startDate: rawBillData.startDate,
      endDate: rawBillData.endDate,
      neverExpires: rawBillData.neverExpires,
      totalAmount: rawBillData.totalAmount,
      discount: rawBillData.discount,
      tdsRate: rawBillData.tdsRate,
      tdsName: rawBillData.tdsName,
      adjustment: rawBillData.adjustment,
      notes: rawBillData.notes,
      status: rawBillData.status,
      vendorId: rawBillData.vendorId,
      CompanyId: rawBillData.CompanyId || companyId
    };

    // Ensure status is valid for the ENUM ('Active', 'Expired', 'Paused')
    const validStatuses = ['Active', 'Expired', 'Paused'];
    if (!validStatuses.includes(billData.status)) {
      billData.status = 'Active';
    }
    
    // Calculate first nextGenerationDate if not provided
    if (!billData.nextGenerationDate) {
      billData.nextGenerationDate = billData.startDate || new Date();
    }
    
    const template = await RecurringBill.create(billData, { transaction: t });
    
    if (items && items.length > 0) {
      const billItems = items.map(item => {
        // Strip the temporary 'id' from frontend if it's not a UUID
        const { id, ...itemData } = item;
        return {
          ...itemData,
          RecurringBillId: template.id
        };
      });
      await RecurringBillItem.bulkCreate(billItems, { transaction: t });
    }
    
    await t.commit();
    
    // Fetch with items for response
    const completeTemplate = await RecurringBill.findByPk(template.id, {
      include: [{ model: RecurringBillItem, as: 'items' }]
    });
    
    res.status(201).json(completeTemplate);
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

exports.getByCompany = async (req, res, next) => {
  try {
    const templates = await RecurringBill.findAll({
      where: { CompanyId: req.params.companyId },
      include: [
        { model: Ledger, as: 'Vendor', attributes: ['name'] },
        { model: RecurringBillItem, as: 'items' }
      ],
      order: [['nextGenerationDate', 'ASC']]
    });
    res.json(templates);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { items, ...billData } = req.body;
    const template = await RecurringBill.findByPk(req.params.id);
    if (!template) {
      await t.rollback();
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // BOLA guard
    const requestingCompanyId = req.body.CompanyId || req.body.companyId || req.user?.CompanyId;
    if (requestingCompanyId && String(template.CompanyId) !== String(requestingCompanyId)) {
      await t.rollback();
      return res.status(403).json({ error: 'Access denied' });
    }

    await template.update(billData, { transaction: t });
    
    if (items) {
      // Simple sync: delete old items and create new ones
      await RecurringBillItem.destroy({
        where: { RecurringBillId: template.id },
        transaction: t
      });
      
      const billItems = items.map(item => ({
        ...item,
        RecurringBillId: template.id
      }));
      await RecurringBillItem.bulkCreate(billItems, { transaction: t });
    }
    
    await t.commit();
    res.json(template);
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const template = await RecurringBill.findByPk(req.params.id);
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
    const templates = await RecurringBill.findAll({
      where: {
        status: 'Active',
        nextGenerationDate: { [require('sequelize').Op.lte]: now }
      },
      include: [{ model: RecurringBillItem, as: 'items' }],
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
      // 1. Create Voucher (Purchase type)
      const voucher = await Voucher.create({
        voucherNumber: `BILL-REC-${Date.now()}`,
        voucherType: 'Purchase',
        date: now,
        narration: JSON.stringify({
          notes: template.notes,
          isRecurring: true,
          templateId: template.id
        }),
        CompanyId: template.CompanyId
      }, { transaction: t });

      // 2. Create Transactions (Double Entry)
      
      // Credit the Vendor (Accounts Payable)
      await Transaction.create({
        VoucherId: voucher.id,
        LedgerId: template.vendorId,
        CompanyId: template.CompanyId,
        type: 'Cr',
        credit: parseFloat(template.totalAmount),
        debit: 0
      }, { transaction: t });

      // Debit the items to their respective accounts
      for (const item of template.items) {
        if (item.amount > 0 && item.account) {
           let accountLedger = await Ledger.findOne({
               where: { name: item.account, CompanyId: template.CompanyId }
           });

           if (accountLedger) {
               await Transaction.create({
                   VoucherId: voucher.id,
                   LedgerId: accountLedger.id,
                   CompanyId: template.CompanyId,
                   type: 'Dr',
                   credit: 0,
                   debit: parseFloat(item.amount)
               }, { transaction: t });
           }
        }
      }

      // Handle TDS if applicable (Credit TDS Ledger)
      if (template.tdsRate > 0) {
          const tdsAmount = (parseFloat(template.totalAmount) * template.tdsRate) / 100;
          let tdsLedger = await Ledger.findOne({
              where: { name: 'TDS Payable', CompanyId: template.CompanyId }
          });
          
          if (tdsLedger) {
              await Transaction.create({
                  VoucherId: voucher.id,
                  LedgerId: tdsLedger.id,
                  CompanyId: template.CompanyId,
                  type: 'Cr',
                  credit: tdsAmount,
                  debit: 0
              }, { transaction: t });
          }
      }

      // 3. Update template timing
      let nextDate = moment(template.nextGenerationDate);
      const freq = template.repeatEvery.toLowerCase();
      
      if (freq.includes('week')) nextDate.add(1, 'weeks');
      else if (freq.includes('2 weeks')) nextDate.add(2, 'weeks');
      else if (freq.includes('month')) nextDate.add(1, 'months');
      else if (freq.includes('2 months')) nextDate.add(2, 'months');
      else if (freq.includes('3 months')) nextDate.add(3, 'months');
      else if (freq.includes('6 months')) nextDate.add(6, 'months');
      else if (freq.includes('year')) nextDate.add(1, 'years');
      
      const updateData = {
        lastGeneratedDate: now,
        nextGenerationDate: nextDate.toDate()
      };

      if (!template.neverExpires && template.endDate && nextDate.isAfter(template.endDate)) {
        updateData.status = 'Expired';
      }

      await template.update(updateData, { transaction: t });
      processed.push({ profile: template.profileName, voucher: voucher.voucherNumber });
    }

    await t.commit();
    res.json({ message: `Successfully processed ${processed.length} recurring bills`, processed });
  } catch (err) {
    await t.rollback();
    console.error(err);
    next(err);
  }
};
