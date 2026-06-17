const { BankTransaction, Voucher, Transaction, Ledger, Group, sequelize } = require('../../models');
const { Op } = require('sequelize');

exports.importStatement = async (req, res, next) => {
  try {
    const { companyId, entries } = req.body; // entries: [{ date, description, amount, type }]
    const created = await BankTransaction.bulkCreate(entries.map(e => ({
      ...e,
      CompanyId: companyId
    })));
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

exports.getUnmatched = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const unmatched = await BankTransaction.findAll({
      where: { CompanyId: companyId, isMatched: false }
    });
    res.json(unmatched);
  } catch (err) {
    next(err);
  }
};

exports.reconcile = async (req, res, next) => {
  try {
    const { bankTransactionId, voucherId } = req.body;
    const bt = await BankTransaction.findByPk(bankTransactionId);
    if (!bt) return res.status(404).json({ error: 'Bank entry not found' });

    await bt.update({ isMatched: true, matchedVoucherId: voucherId });
    res.json({ message: 'Successfully reconciled', bankTransaction: bt });
  } catch (err) {
    next(err);
  }
};
