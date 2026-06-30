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

    // ── Duplicate-name check (company-wide, case-insensitive) ───────────────
    // Tally standard: ledger names must be unique within the entire company,
    // not just within a group. Two ledgers named "Cash" in different groups
    // would cause ambiguity in voucher entry and reports.
    if (name && targetCompanyId) {
      const existing = await Ledger.findOne({
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.col('name')),
              name.trim().toLowerCase()
            ),
            { CompanyId: targetCompanyId }
          ]
        }
      });
      if (existing) {
        return res.status(409).json({
          error: `A ledger named "${name.trim()}" already exists in this company. Ledger names must be unique across all groups.`
        });
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
      tdsApplicable: req.body.tdsApplicable,
      tds_section: req.body.tds_section,
      tds_rate: req.body.tds_rate,
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
    const { name, groupId, openingBalance, openingBalanceType, description, address, gstNumber, accountNumber, bankName, ifsc, accountCode, tdsApplicable, tds_section, tds_rate } = req.body;
    const ledger = await Ledger.findByPk(req.params.id);
    if (!ledger) return res.status(404).json({ error: 'Ledger not found' });
    
    const oldData = ledger.toJSON();
    // ── Explicit whitelist of updatable fields (no ...req.body spread) ────────
    // Only the fields listed here can be changed via this endpoint.
    // This prevents mass-assignment of sensitive fields like CompanyId, GroupId chain, deletedAt.
    const { email, mobile, workPhone, phone, website, pan, creditLimit, language,
            billingAddress, shippingAddress, billingAddressJson, shippingAddressJson,
            contactPersonsJson, bankDetailsJson, tdsApplicable, tds_section, tds_rate,
            state, registrationType, customerType, salutation, firstName, lastName,
            companyName, department, designation } = req.body;

    await ledger.update({
      name:                name                !== undefined ? name.trim()            : ledger.name,
      GroupId:             groupId             !== undefined ? groupId                 : ledger.GroupId,
      openingBalance:      openingBalance      !== undefined ? openingBalance          : ledger.openingBalance,
      openingBalanceType:  openingBalanceType  !== undefined ? openingBalanceType      : ledger.openingBalanceType,
      currentBalance:      openingBalance      !== undefined ? openingBalance          : ledger.currentBalance,
      description:         description         !== undefined ? description             : ledger.description,
      address:             address             !== undefined ? address                 : ledger.address,
      gstNumber:           gstNumber           !== undefined ? gstNumber               : ledger.gstNumber,
      accountNumber:       accountNumber       !== undefined ? accountNumber           : ledger.accountNumber,
      bankName:            bankName            !== undefined ? bankName                : ledger.bankName,
      ifsc:                ifsc                !== undefined ? ifsc                    : ledger.ifsc,
      accountCode:         accountCode         !== undefined ? accountCode             : ledger.accountCode,
      // Contact fields
      email:               email               !== undefined ? email                   : ledger.email,
      mobile:              mobile              !== undefined ? mobile                  : ledger.mobile,
      workPhone:           workPhone           !== undefined ? workPhone               : ledger.workPhone,
      phone:               phone               !== undefined ? phone                   : ledger.phone,
      website:             website             !== undefined ? website                 : ledger.website,
      pan:                 pan                 !== undefined ? pan                     : ledger.pan,
      creditLimit:         creditLimit         !== undefined ? creditLimit             : ledger.creditLimit,
      language:            language            !== undefined ? language                : ledger.language,
      state:               state               !== undefined ? state                   : ledger.state,
      registrationType:    registrationType    !== undefined ? registrationType        : ledger.registrationType,
      customerType:        customerType        !== undefined ? customerType            : ledger.customerType,
      salutation:          salutation          !== undefined ? salutation              : ledger.salutation,
      firstName:           firstName           !== undefined ? firstName               : ledger.firstName,
      lastName:            lastName            !== undefined ? lastName                : ledger.lastName,
      companyName:         companyName         !== undefined ? companyName             : ledger.companyName,
      department:          department          !== undefined ? department              : ledger.department,
      designation:         designation         !== undefined ? designation             : ledger.designation,
      // Address JSON fields
      billingAddress:      billingAddress      !== undefined ? billingAddress          : ledger.billingAddress,
      shippingAddress:     shippingAddress     !== undefined ? shippingAddress         : ledger.shippingAddress,
      billingAddressJson:  billingAddressJson  !== undefined ? billingAddressJson      : ledger.billingAddressJson,
      shippingAddressJson: shippingAddressJson !== undefined ? shippingAddressJson     : ledger.shippingAddressJson,
      contactPersonsJson:  contactPersonsJson  !== undefined ? contactPersonsJson      : ledger.contactPersonsJson,
      bankDetailsJson:     bankDetailsJson     !== undefined ? bankDetailsJson         : ledger.bankDetailsJson,
      // Tax compliance fields
      tdsApplicable:       tdsApplicable       !== undefined ? tdsApplicable           : ledger.tdsApplicable,
      tds_section:         tds_section         !== undefined ? tds_section             : ledger.tds_section,
      tds_rate:            tds_rate            !== undefined ? tds_rate                : ledger.tds_rate
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
// NOTE: Ledgers with transactions can NEVER be deleted to preserve accounting history.
// Use soft-delete (paranoid: true) or deactivate the ledger instead.
exports.deleteLedger = async (req, res, next) => {
  try {
    const ledger = await Ledger.findByPk(req.params.id);
    if (!ledger) return res.status(404).json({ error: 'Ledger not found' });

    const txCount = await Transaction.count({ where: { LedgerId: req.params.id } });
    if (txCount > 0) {
      return res.status(400).json({
        error: `Cannot delete "${ledger.name}": it has ${txCount} transaction(s). ` +
               `Deleting a ledger with history would corrupt your books. ` +
               `If you no longer use this ledger, consider renaming it with a [INACTIVE] prefix instead.`
      });
    }

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
