const { Ledger, Group, Transaction, sequelize } = require('../../models');
const AuditService = require('../../services/AuditService');

// Create a Ledger under a Group
exports.createLedger = async (req, res) => {
  try {
    const { companyId, CompanyId, groupId, GroupId, name, openingBalance, openingBalanceType, description, address, gstNumber, groupName } = req.body;
    let finalGroupId = groupId || GroupId;
    
    // Auto-resolve groupName to GroupId for CRM endpoints
    if (!finalGroupId && groupName) {
      const foundGroup = await Group.findOne({ 
        where: { name: groupName, CompanyId: companyId || CompanyId } 
      });
      if (foundGroup) finalGroupId = foundGroup.id;
    }

    const ledger = await Ledger.create({
      ...req.body,
      name,
      openingBalance: openingBalance || 0,
      openingBalanceType: openingBalanceType || 'Dr',
      currentBalance: openingBalance || 0,
      description,
      address,
      gstNumber,
      GroupId: finalGroupId,
      CompanyId: companyId || CompanyId
    });

    await AuditService.log({
      action: 'CREATE_LEDGER',
      tableName: 'Ledgers',
      recordId: ledger.id,
      newData: ledger,
      companyId: ledger.CompanyId,
      userId: req.user?.id,
      req
    });

    res.status(201).json(ledger);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all Ledgers for a company, grouped by their parent Group
exports.getLedgers = async (req, res) => {
  try {
    console.log(`[LEDGER_FETCH] Requesting ledgers for companyId: ${req.params.companyId}`);
    const ledgers = await Ledger.findAll({
      where: { CompanyId: req.params.companyId },
      include: [{ model: Group, attributes: ['id', 'name', 'nature'] }],
      order: [['name', 'ASC']]
    });
    res.json(ledgers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single Ledger with its computed balance (from transactions)
exports.getLedgerBalance = async (req, res) => {
  try {
    const ledger = await Ledger.findByPk(req.params.id, {
      include: [{ model: Group, attributes: ['name', 'nature'] }]
    });
    if (!ledger) return res.status(404).json({ error: 'Ledger not found' });

    // Compute balance from transactions (Tally way: never trust stored balance)
    const result = await Transaction.findAll({
      where: { LedgerId: req.params.id },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('debit')), 'totalDebit'],
        [sequelize.fn('SUM', sequelize.col('credit')), 'totalCredit']
      ],
      raw: true
    });

    const totalDebit = parseFloat(result[0].totalDebit || 0);
    const totalCredit = parseFloat(result[0].totalCredit || 0);
    const computedBalance = parseFloat(ledger.openingBalance) + totalDebit - totalCredit;

    res.json({
      ...ledger.toJSON(),
      computedBalance,
      totalDebit,
      totalCredit
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a ledger
exports.updateLedger = async (req, res) => {
  try {
    const { name, groupId, openingBalance, openingBalanceType, description, address, gstNumber } = req.body;
    const ledger = await Ledger.findByPk(req.params.id);
    if (!ledger) return res.status(404).json({ error: 'Ledger not found' });
    
    const oldData = ledger.toJSON();
    await ledger.update({ 
      ...req.body,
      name: name || ledger.name, 
      GroupId: groupId || ledger.GroupId, 
      openingBalance: openingBalance !== undefined ? openingBalance : ledger.openingBalance,
      openingBalanceType: openingBalanceType || ledger.openingBalanceType,
      currentBalance: openingBalance !== undefined ? openingBalance : ledger.currentBalance,
      description: description !== undefined ? description : ledger.description,
      address: address !== undefined ? address : ledger.address,
      gstNumber: gstNumber !== undefined ? gstNumber : ledger.gstNumber
    });

    await AuditService.log({
      action: 'UPDATE_LEDGER',
      tableName: 'Ledgers',
      recordId: ledger.id,
      oldData,
      newData: ledger,
      companyId: ledger.CompanyId,
      userId: req.user?.id,
      req
    });

    res.json(ledger);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all transactions for a specific ledger
exports.getLedgerTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { LedgerId: req.params.id },
      include: [{ model: Voucher, attributes: ['voucherNumber', 'voucherType', 'date', 'narration'] }],
      order: [[Voucher, 'date', 'DESC']]
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a Ledger (only if no transactions exist)
exports.deleteLedger = async (req, res) => {
  try {
    const txCount = await Transaction.count({ where: { LedgerId: req.params.id } });
    if (txCount > 0) {
      return res.status(400).json({ error: 'Cannot delete ledger with existing transactions.' });
    }
    const ledger = await Ledger.findByPk(req.params.id);
    if (!ledger) return res.status(404).json({ error: 'Ledger not found' });

    await Ledger.destroy({ where: { id: req.params.id } });

    await AuditService.log({
      action: 'DELETE_LEDGER',
      tableName: 'Ledgers',
      recordId: req.params.id,
      oldData: ledger,
      companyId: ledger.CompanyId,
      userId: req.user?.id,
      req
    });

    res.json({ message: 'Ledger deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
