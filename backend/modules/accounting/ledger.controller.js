const { Ledger, Group, Transaction, Voucher, sequelize } = require('../../models');
const { Op } = require('sequelize');
const AuditService = require('../../services/AuditService');

// ─── Helper: find-or-create a standard group ────────────────────────────────
const AUTO_GROUPS = {
  'Sundry Debtors':   { nature: 'Assets',      parent: 'Current Assets',      category: 'Sub-Group' },
  'Sundry Creditors': { nature: 'Liabilities',  parent: 'Current Liabilities', category: 'Sub-Group' },
  'Bank Accounts':    { nature: 'Assets',        parent: 'Current Assets',      category: 'Sub-Group' },
  'Bank OD A/c':      { nature: 'Liabilities',   parent: 'Loans (Liability)',   category: 'Sub-Group' },
  'Cash-in-Hand':     { nature: 'Assets',        parent: 'Current Assets',      category: 'Sub-Group' },
};

async function findOrCreateGroup(groupName, companyId) {
  let group = await Group.findOne({ where: { name: groupName, CompanyId: companyId } });
  if (group) return group;

  const meta = AUTO_GROUPS[groupName];
  if (!meta) return null; // Unknown group — cannot auto-create

  console.log(`[LEDGER_CONTROLLER] Auto-creating missing group: "${groupName}" for company ${companyId}`);

  // Find or create parent group first
  let parentId = null;
  if (meta.parent) {
    let parentGroup = await Group.findOne({ where: { name: meta.parent, CompanyId: companyId } });
    if (!parentGroup) {
      parentGroup = await Group.create({
        name: meta.parent,
        nature: meta.nature, // Same nature as child (safe default)
        category: 'Primary',
        CompanyId: companyId
      });
    }
    parentId = parentGroup.id;
  }

  group = await Group.create({
    name: groupName,
    nature: meta.nature,
    category: meta.category,
    parent_id: parentId,
    CompanyId: companyId
  });

  return group;
}

// Create a Ledger under a Group
exports.createLedger = async (req, res, next) => {
  console.log('[CREATE_LEDGER] Request Body:', JSON.stringify(req.body, null, 2));
  try {
    const { companyId, CompanyId, groupId, GroupId, name, openingBalance, openingBalanceType, description, address, gstNumber, groupName } = req.body;
    const targetCompanyId = req.companyId || companyId || CompanyId;
    if (!targetCompanyId) {
      return res.status(400).json({ error: 'SECURITY ERROR: Company ID is strictly required.' });
    }
    let finalGroupId = groupId || GroupId;

    // Auto-resolve groupName → GroupId
    if (!finalGroupId && groupName) {
      let foundGroup = await Group.findOne({ 
        where: { name: groupName, CompanyId: targetCompanyId } 
      });

      // Auto-create essential system groups if missing (Banking, Vendor, Customer, GST)
      if (!foundGroup && ['Bank Accounts', 'Bank OD A/c', 'Cash-in-Hand', 'Sundry Creditors', 'Sundry Debtors', 'Duties & Taxes'].includes(groupName)) {
        console.log(`[LEDGER_CONTROLLER] Auto-creating missing system group: ${groupName}`);
        let nature = 'Liabilities';
        let category = 'Primary';
        if (['Bank Accounts', 'Cash-in-Hand', 'Sundry Debtors'].includes(groupName)) {
          nature = 'Assets';
        }
        if (['Sundry Creditors', 'Sundry Debtors', 'Duties & Taxes'].includes(groupName)) {
          category = 'Sub-Group';
        }

        let parent_id = null;
        let parentName = '';
        if (groupName === 'Sundry Creditors' || groupName === 'Duties & Taxes') parentName = 'Current Liabilities';
        if (groupName === 'Sundry Debtors') parentName = 'Current Assets';
        
        if (parentName) {
          const parentGroup = await Group.findOne({ where: { name: parentName, CompanyId: targetCompanyId } });
          if (parentGroup) parent_id = parentGroup.id;
        }

        foundGroup = await Group.create({
          name: groupName,
          nature,
          category,
          parent_id,
          CompanyId: targetCompanyId
        });
      }
      
      if (foundGroup) {
        finalGroupId = foundGroup.id;
      } else {
        const resolvedGroup = await findOrCreateGroup(groupName, targetCompanyId);
        if (resolvedGroup) finalGroupId = resolvedGroup.id;
      }
    }

    // ── Duplicate-name check ─────────────────────────────────────────────────
    // Prevent two ledgers with the same name in the same group+company.
    // (Case-insensitive match)
    if (name && finalGroupId && targetCompanyId) {
      const existing = await Ledger.findOne({
        where: {
          name: { [Op.like]: name.trim() },
          GroupId: finalGroupId,
          CompanyId: targetCompanyId
        }
      });
      if (existing) {
        console.log(`[CREATE_LEDGER] Duplicate detected: "${name}" already exists in group ${finalGroupId}. Returning existing.`);
        return res.status(200).json({ ...existing.toJSON(), _duplicate: true });
      }
    }

    const ledger = await Ledger.create({
      ...req.body,
      name: name?.trim(),
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
      CompanyId: targetCompanyId
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
    if (err.name === 'SequelizeValidationError' && err.errors && err.errors.length > 0) {
      errorMessage = err.errors.map(e => e.message).join(', ');
      return res.status(400).json({ error: errorMessage });
    }
    res.status(500).json({ error: errorMessage });
  }
};


exports.getLedgers = async (req, res, next) => {
  try {
    console.log(`[LEDGER_FETCH] Requesting ledgers for companyId: ${req.params.companyId}`);
    const ledgers = await Ledger.findAll({
      where: { CompanyId: req.params.companyId },
      include: [
        { model: Group, attributes: ['id', 'name', 'nature'] },
        { model: Transaction, attributes: [] }
      ],
      attributes: {
        include: [
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('Transactions.debit')), 0), 'totalDebit'],
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('Transactions.credit')), 0), 'totalCredit']
        ]
      },
      group: ['Ledger.id', 'Group.id'],
      raw: true,
      nest: true,
      order: [['name', 'ASC']]
    });
    res.json(ledgers);
  } catch (err) {
    next(err);
  }
};

// Get a single Ledger with its computed balance (from transactions)
exports.getLedgerBalance = async (req, res, next) => {
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
    next(err);
  }
};

// Update a ledger
exports.updateLedger = async (req, res, next) => {
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
    if (err.name === 'SequelizeValidationError' && err.errors && err.errors.length > 0) {
      const errorMessage = err.errors.map(e => e.message).join(', ');
      return res.status(400).json({ error: errorMessage });
    }
    next(err);
  }
};

// Get all transactions for a specific ledger
exports.getLedgerTransactions = async (req, res, next) => {
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
    next(err);
  }
};

// Delete a Ledger (only if no transactions exist)
exports.deleteLedger = async (req, res, next) => {
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
    next(err);
  }
};
