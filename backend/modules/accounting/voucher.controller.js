const { Voucher, Transaction, Ledger, CostCenterAllocation, CostCenter, sequelize } = require('../../models');
const { Op } = require('sequelize');
const AccountingService = require('../../services/AccountingService');
const AuditService = require('../../services/AuditService');

exports.createVoucher = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { companyId, voucherType, date, narration, entries, referenceNumber, reportingMethod, currency, projectId } = req.body;

    if (!entries || entries.length < 2) {
      return res.status(400).json({ error: 'Minimum 2 entries required for double-entry.' });
    }

    // Call Universal Journal Engine
    const voucher = await AccountingService.recordJournalEntry({
      companyId,
      date,
      narration,
      reference: referenceNumber,
      voucherType: voucherType || 'Journal',
      entries: entries.map(e => ({
        ledgerId: e.ledgerId,
        costCenterId: e.costCenterId || null,
        allocations: e.allocations || [],
        debit: parseFloat(e.debit || 0),
        credit: parseFloat(e.credit || 0),
        description: e.description,
        contactId: e.contactId
      })),
      userId: req.user?.id,
      voucherNumber: req.body.voucherNumber,
      reportingMethod,
      currency,
      projectId
    }, t);

    await t.commit();

    // Log the successful creation
    await AuditService.log({
      action: 'CREATE_VOUCHER',
      tableName: 'Vouchers',
      recordId: voucher.id,
      newData: voucher,
      companyId: companyId,
      userId: req.user?.id,
      req
    });

    res.status(201).json({ message: 'Voucher posted successfully.', voucher });
  } catch (err) {
    if (t) await t.rollback();
    err.statusCode = 400;
    next(err);
  }
};

exports.updateVoucher = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { companyId, date, narration, entries, referenceNumber, voucherNumber, reportingMethod, currency } = req.body;

    if (!entries || entries.length < 2) {
      return res.status(400).json({ error: 'Minimum 2 entries required for double-entry.' });
    }

    const voucher = await AccountingService.updateJournalEntry(id, {
      companyId,
      date,
      narration,
      reference: referenceNumber,
      entries: entries.map(e => ({
        ledgerId: e.ledgerId,
        costCenterId: e.costCenterId || null,
        allocations: e.allocations || [],
        debit: parseFloat(e.debit || 0),
        credit: parseFloat(e.credit || 0),
        description: e.description,
        contactId: e.contactId
      })),
      userId: req.user?.id,
      voucherNumber,
      reportingMethod,
      currency
    }, t);

    await t.commit();

    await AuditService.log({
      action: 'UPDATE_VOUCHER',
      tableName: 'Vouchers',
      recordId: voucher.id,
      newData: voucher,
      companyId: companyId,
      userId: req.user?.id,
      req
    });

    res.json({ message: 'Voucher updated successfully.', voucher });
  } catch (err) {
    if (t) await t.rollback();
    err.statusCode = 400;
    next(err);
  }
};

exports.getVouchers = async (req, res, next) => {
  console.log('GET Vouchers for Company:', req.params.companyId);
  try {
    const vouchers = await Voucher.findAll({
      where: { CompanyId: req.params.companyId },
      include: [{
        model: Transaction,
        include: [
          { 
            model: Ledger, 
            attributes: [
              'id', 'name', 'currency', 'billingAddress', 'shippingAddress', 
              'address', 'gstNumber', 'pan', 'email', 'phone', 'mobile', 'workPhone'
            ] 
          },
          {
            model: CostCenterAllocation,
            include: [{
              model: CostCenter,
              attributes: ['id', 'name']
            }]
          }
        ]
      }],
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(vouchers);
  } catch (err) {
    next(err);
  }
};

exports.getVoucherById = async (req, res, next) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id, {
      include: [{
        model: Transaction,
        include: [
          { 
            model: Ledger, 
            attributes: [
              'id', 'name', 'currency', 'billingAddress', 'shippingAddress', 
              'address', 'gstNumber', 'pan', 'email', 'phone', 'mobile', 'workPhone'
            ] 
          },
          {
            model: CostCenterAllocation,
            include: [{
              model: CostCenter,
              attributes: ['id', 'name']
            }]
          }
        ]
      }]
    });
    if (!voucher) return res.status(404).json({ error: 'Voucher not found' });

    const plainVoucher = voucher.toJSON();
    if (voucher.voucherType === 'Purchase') {
      const crTx = plainVoucher.Transactions?.find(t => parseFloat(t.credit || 0) > 0);
      const totalAmount = crTx ? parseFloat(crTx.credit || 0) : 0;

      const payments = await Transaction.findAll({
        where: {
          description: { [Op.like]: `%BILL_REF:${voucher.id}%` }
        },
        include: [{
          model: Voucher,
          where: { status: 'Paid' }
        }]
      });
      const amountPaid = payments.reduce((sum, p) => sum + parseFloat(p.debit || 0), 0);
      plainVoucher.balanceDue = Math.max(0, totalAmount - amountPaid);
      plainVoucher.amountPaid = amountPaid;
      plainVoucher.totalAmount = totalAmount;

      let status = voucher.status;
      if (!status) {
        if (totalAmount <= 0) status = 'DRAFT';
        else if (plainVoucher.balanceDue <= 0.01) status = 'PAID';
        else if (amountPaid > 0) status = 'PARTIALLY_PAID';
        else status = 'OPEN';
      }
      plainVoucher.status = status;
    }

    res.json(plainVoucher);
  } catch (err) {
    next(err);
  }
};

exports.deleteVoucher = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const voucher = await Voucher.findByPk(req.params.id);
    if (!voucher) {
      if (t) await t.rollback();
      return res.status(404).json({ error: 'Voucher not found' });
    }

    // Call ledger service to reverse balances and delete entries atomically
    await AccountingService.deleteJournalEntry(req.params.id, {
      companyId: voucher.CompanyId,
      userId: req.user?.id
    }, t);

    await t.commit();
    res.json({ message: 'Voucher deleted successfully.' });
  } catch (err) {
    if (t) await t.rollback();
    next(err);
  }
};

exports.updateVoucherNarration = async (req, res, next) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id);
    if (!voucher) return res.status(404).json({ error: 'Voucher not found' });
    
    // We only allow updating the narration for these kinds of UI attachments (receipts)
    voucher.narration = req.body.narration;
    await voucher.save();
    
    res.json({ message: 'Voucher narration updated successfully', voucher });
  } catch (err) {
    next(err);
  }
};

exports.bulkUpdateTransactions = async (req, res, next) => {
  try {
    const { companyId, transactionIds, targetLedgerId } = req.body;
    if (!transactionIds || !transactionIds.length) {
      return res.status(400).json({ error: 'No transactions provided for update.' });
    }
    if (!targetLedgerId) {
      return res.status(400).json({ error: 'Target ledger not specified.' });
    }

    const result = await AccountingService.bulkUpdateTransactions({
      companyId,
      transactionIds,
      targetLedgerId,
      userId: req.user?.id
    });

    res.json({ message: `Successfully updated ${result.updatedCount} transactions.`, result });
  } catch (err) {
    next(err);
  }
};

exports.getTransactions = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const transactions = await Transaction.findAll({
      where: { CompanyId: companyId },
      include: [
        { model: Ledger, attributes: ['id', 'name', 'code'] },
        { model: Voucher, attributes: ['id', 'voucherNumber', 'voucherType', 'date', 'narration', 'reference'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(transactions);
  } catch (err) {
    next(err);
  }
};

exports.approveVoucher = async (req, res, next) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id);
    if (!voucher) return res.status(404).json({ error: 'Voucher not found' });
    
    voucher.status = 'Approved';
    if (req.user && req.user.id) voucher.ModifiedBy = req.user.id;
    await voucher.save();
    
    res.json({ message: 'Voucher approved successfully.', voucher });
  } catch (err) {
    next(err);
  }
};

exports.cancelVoucher = async (req, res, next) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id);
    if (!voucher) return res.status(404).json({ error: 'Voucher not found' });
    
    voucher.status = 'Cancelled';
    if (req.user && req.user.id) voucher.ModifiedBy = req.user.id;
    await voucher.save();
    
    res.json({ message: 'Voucher cancelled successfully.', voucher });
  } catch (err) {
    next(err);
  }
};

