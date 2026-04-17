const { Ledger, Group, Transaction, Voucher, sequelize } = require('../../models');
const AuditService = require('../../services/AuditService');

// Create a Ledger under a Group
exports.createLedger = async (req, res) => {
  console.log('[CREATE_LEDGER] Request Body:', JSON.stringify(req.body, null, 2));
  try {
    const { companyId, CompanyId, groupId, GroupId, name, openingBalance, openingBalanceType, description, address, gstNumber, groupName } = req.body;
    let finalGroupId = groupId || GroupId;
    
    // Auto-resolve groupName to GroupId
    if (!finalGroupId && groupName) {
      let foundGroup = await Group.findOne({ 
        where: { name: groupName, CompanyId: companyId || CompanyId } 
      });

      // If banking group is missing, auto-create it (essential for Banking module)
      if (!foundGroup && ['Bank Accounts', 'Bank OD A/c', 'Cash-in-Hand'].includes(groupName)) {
        console.log(`[LEDGER_CONTROLLER] Auto-creating missing system group: ${groupName}`);
        foundGroup = await Group.create({
          name: groupName,
          nature: groupName === 'Bank Accounts' || groupName === 'Cash-in-Hand' ? 'Assets' : 'Liabilities',
          category: 'Primary',
          CompanyId: companyId || CompanyId
        });
      }

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
      accountNumber: req.body.accountNumber,
      bankName: req.body.bankName,
      ifsc: req.body.ifsc,
      accountCode: req.body.accountCode,
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
    console.error('CREATE_LEDGER_ERROR:', err);
    let errorMessage = err.message;
    if (err.errors && err.errors.length > 0) {
      errorMessage = err.errors.map(e => e.message).join(', ');
    }
    res.status(500).json({ error: errorMessage });
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
  console.log(`[GET_BALANCE] ID: ${req.params.id}`);
  try {
    const ledger = await Ledger.findByPk(req.params.id, {
      include: [{ model: Group, attributes: ['name', 'nature'] }]
    });
    if (!ledger) {
      console.warn(`[GET_BALANCE] Ledger ${req.params.id} not found`);
      return res.status(404).json({ error: 'Ledger not found' });
    }

    // Compute balance from transactions (Tally way: never trust stored balance)
    const result = await Transaction.findAll({
      where: { LedgerId: req.params.id },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('debit')), 'totalDebit'],
        [sequelize.fn('SUM', sequelize.col('credit')), 'totalCredit']
      ],
      raw: true
    });

    const totalDebit = Number(result[0]?.totalDebit || 0);
    const totalCredit = Number(result[0]?.totalCredit || 0);
    const openingBal = Number(ledger.openingBalance || 0);
    
    // Tally balance logic
    const computedBalance = ledger.openingBalanceType === 'Dr' 
      ? openingBal + totalDebit - totalCredit
      : openingBal + totalCredit - totalDebit;

    console.log(`[GET_BALANCE] Success: ${ledger.name}, Balance: ${computedBalance}`);

    res.json({
      ...ledger.toJSON(),
      computedBalance: isNaN(computedBalance) ? 0 : computedBalance,
      totalDebit: isNaN(totalDebit) ? 0 : totalDebit,
      totalCredit: isNaN(totalCredit) ? 0 : totalCredit
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a ledger
exports.updateLedger = async (req, res) => {
  console.log(`[UPDATE_LEDGER] ID: ${req.params.id}, Body:`, JSON.stringify(req.body, null, 2));
  try {
    const { name, groupId, openingBalance, openingBalanceType, description, address, gstNumber, accountNumber, bankName, ifsc, accountCode } = req.body;
    const ledger = await Ledger.findByPk(req.params.id);
    if (!ledger) return res.status(404).json({ error: 'Ledger not found' });
    
    const oldData = ledger.toJSON();
    await ledger.update({ 
      ...req.body, // Spread first
      name: name || ledger.name, 
      GroupId: groupId || ledger.GroupId, 
      openingBalance: openingBalance !== undefined ? openingBalance : ledger.openingBalance,
      openingBalanceType: openingBalanceType || ledger.openingBalanceType,
      currentBalance: openingBalance !== undefined ? openingBalance : ledger.currentBalance,
      description: description !== undefined ? description : ledger.description,
      address: address !== undefined ? address : ledger.address,
      gstNumber: gstNumber !== undefined ? gstNumber : ledger.gstNumber,
      accountNumber: accountNumber !== undefined ? accountNumber : ledger.accountNumber,
      bankName: bankName !== undefined ? bankName : ledger.bankName,
      ifsc: ifsc !== undefined ? ifsc : ledger.ifsc,
      accountCode: accountCode !== undefined ? accountCode : ledger.accountCode
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

    console.log(`[UPDATE_LEDGER] Success: ${ledger.name}`);
    res.json(ledger);
  } catch (err) {
    console.error(`[UPDATE_LEDGER] Error:`, err);
    res.status(500).json({ error: err.message });
  }
};

// Get all transactions for a specific ledger
exports.getLedgerTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { LedgerId: req.params.id },
      include: [{ 
        model: Voucher, 
        attributes: ['voucherNumber', 'voucherType', 'date', 'narration'],
        required: false // Left join
      }],
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
