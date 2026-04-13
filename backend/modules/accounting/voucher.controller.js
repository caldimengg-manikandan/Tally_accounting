const { Voucher, Transaction, Ledger, sequelize } = require('../../models');
const AccountingService = require('../../services/AccountingService');
const AuditService = require('../../services/AuditService');

exports.createVoucher = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { companyId, voucherType, date, narration, entries } = req.body;

    if (!entries || entries.length < 2) {
      return res.status(400).json({ error: 'Minimum 2 entries required for double-entry.' });
    }

    // Call Universal Journal Engine
    const voucher = await AccountingService.recordJournalEntry({
      companyId,
      date,
      narration,
      voucherType: voucherType || 'Journal',
      entries: entries.map(e => ({
        ledgerId: e.ledgerId,
        debit: parseFloat(e.debit || 0),
        credit: parseFloat(e.credit || 0)
      })),
      userId: req.user?.id
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
    res.status(400).json({ error: err.message });
  }
};

exports.getVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.findAll({
      where: { CompanyId: req.params.companyId },
      include: [{
        model: Transaction,
        include: [{ model: Ledger, attributes: ['id', 'name'] }]
      }],
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(vouchers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getVoucherById = async (req, res) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id, {
      include: [{
        model: Transaction,
        include: [{ model: Ledger, attributes: ['id', 'name'] }]
      }]
    });
    if (!voucher) return res.status(404).json({ error: 'Voucher not found' });
    res.json(voucher);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteVoucher = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const voucher = await Voucher.findByPk(req.params.id);
    if (!voucher) return res.status(404).json({ error: 'Voucher not found' });

    // In a sophisticated system, we'd adjust balances here if not using dynamic totals
    // Since we use dynamic totals, deleting the Transactions is enough
    await Transaction.destroy({ where: { VoucherId: voucher.id }, transaction: t });
    await voucher.destroy({ transaction: t });

    await t.commit();

    // Log the deletion
    await AuditService.log({
      action: 'DELETE_VOUCHER',
      tableName: 'Vouchers',
      recordId: voucher.id,
      oldData: voucher,
      companyId: voucher.CompanyId,
      userId: req.user?.id,
      req
    });

    res.json({ message: 'Voucher deleted successfully.' });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ error: err.message });
  }
};

exports.updateVoucherNarration = async (req, res) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id);
    if (!voucher) return res.status(404).json({ error: 'Voucher not found' });
    
    // We only allow updating the narration for these kinds of UI attachments (receipts)
    voucher.narration = req.body.narration;
    await voucher.save();
    
    res.json({ message: 'Voucher narration updated successfully', voucher });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
