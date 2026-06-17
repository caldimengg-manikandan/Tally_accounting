const { Company, User, Group, Ledger, sequelize } = require('../../models');

exports.seedDefaultGroups = async (companyId, transaction = null) => {
  const { Group: GroupModel } = require('../../models');
  const { standardGroups } = require('../../helpers/tallyGroups');
  
  const options = transaction ? { transaction } : {};
  
  const primaryGroups = standardGroups.filter(g => !g.parent);
  const groupMap = {};
  for (const g of primaryGroups) {
    const created = await GroupModel.create({
      name: g.name,
      nature: g.nature,
      category: 'Primary',
      CompanyId: companyId
    }, options);
    groupMap[g.name] = created.id;
  }
  
  const subGroups = standardGroups.filter(g => g.parent);
  for (const g of subGroups) {
    const created = await GroupModel.create({
      name: g.name,
      nature: g.nature,
      category: 'Sub-Group',
      parent_id: groupMap[g.parent] || null,
      CompanyId: companyId
    }, options);
    groupMap[g.name] = created.id;
  }
};

exports.seedDefaultLedgers = async (companyId, transaction = null) => {
  const { Group: GroupModel, Ledger: LedgerModel } = require('../../models');
  const options = transaction ? { transaction } : {};

  const defaultLedgers = [
    { name: 'Cash', group: 'Cash-in-Hand' },
    { name: 'Capital Account', group: 'Capital Account' },
    { name: 'Purchase Account', group: 'Purchase Accounts' },
    { name: 'Sales Account', group: 'Sales Accounts' },
    { name: 'CGST Input', group: 'Duties & Taxes' },
    { name: 'CGST Output', group: 'Duties & Taxes' },
    { name: 'SGST Input', group: 'Duties & Taxes' },
    { name: 'SGST Output', group: 'Duties & Taxes' },
    { name: 'IGST Input', group: 'Duties & Taxes' },
    { name: 'IGST Output', group: 'Duties & Taxes' }
  ];

  // Fetch all groups for this company to map by name
  const groups = await GroupModel.findAll({ where: { CompanyId: companyId }, ...options });
  const groupMap = {};
  groups.forEach(g => { groupMap[g.name] = g.id; });

  for (const ledger of defaultLedgers) {
    const groupId = groupMap[ledger.group];
    if (!groupId) {
      console.warn(`[WARNING] Cannot create ledger ${ledger.name}: Group ${ledger.group} not found for company ${companyId}`);
      continue;
    }

    // Ensure it doesn't already exist to prevent duplicates
    const existing = await LedgerModel.findOne({
      where: { name: ledger.name, CompanyId: companyId, GroupId: groupId },
      ...options
    });

    if (!existing) {
      await LedgerModel.create({
        name: ledger.name,
        groupName: ledger.group,
        GroupId: groupId,
        CompanyId: companyId,
        openingBalance: 0,
        currentBalance: 0
      }, options);
    }
  }
};

exports.createCompany = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { 
      name, gstNumber, address, financialYearStart, booksBeginningFrom, userId,
      industry, location, street1, street2, city, pincode, phone, faxNumber,
      website, baseCurrency, fiscalYear, reportBasis, language, timezone,
      dateFormat, organizationId, logoUrl, additionalFields, state, panNumber
    } = req.body;

    if (gstNumber) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(gstNumber.toUpperCase())) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Invalid GSTIN format. Expected format: 33AAAAA1111A1Z1' });
      }
    }
    if (panNumber) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(panNumber.toUpperCase())) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Invalid PAN format. Expected format: ABCDE1234F' });
      }
    }

    const company = await Company.create({
      name,
      gstNumber,
      address,
      financialYearStart,
      booksBeginningFrom,
      industry,
      location,
      street1,
      street2,
      city,
      pincode,
      phone,
      faxNumber,
      website,
      baseCurrency,
      fiscalYear,
      reportBasis,
      language,
      timezone,
      dateFormat,
      organizationId,
      logoUrl,
      additionalFields,
      state,
      panNumber,
      userId: req.user?.id || userId
    }, { transaction });
    
    const userIdToFind = req.user?.id || userId;
    const userInstance = userIdToFind ? await User.findByPk(userIdToFind, { transaction }) : null;
    if (userInstance) {
      await company.addUser(userInstance, { transaction });
      
      // Auto-set as active company if user doesn't have one
      if (!userInstance.activeCompanyId) {
        userInstance.activeCompanyId = company.id;
        await userInstance.save({ transaction });
      }
    }

    // Auto-seed Tally standard groups for the newly created company
    await exports.seedDefaultGroups(company.id, transaction);
    
    // Auto-seed default ledgers within those groups
    await exports.seedDefaultLedgers(company.id, transaction);
    
    await transaction.commit();

    res.status(201).json({
      ...company.toJSON(),
      message: 'Company created and set as active'
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getCompanies = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findByPk(req.user.id, {
      include: [{ model: Company }]
    });

    const companies = user ? (user.Companies || []) : [];
    companies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Attach counts
    const result = await Promise.all(companies.map(async (c) => ({
      ...c.toJSON(),
      groupCount: await Group.count({ where: { CompanyId: c.id } }),
      ledgerCount: await Ledger.count({ where: { CompanyId: c.id } }),
    })));
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getCompanyById = async (req, res, next) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    if (req.user.role !== 'SUPER_ADMIN') {
      const user = await User.findByPk(req.user.id, {
        include: [Company]
      });
      const hasAccess = user.Companies && user.Companies.some(c => c.id === company.id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied: You do not have access to this company' });
      }
    }

    // Get counts
    const groupCount = await Group.count({ where: { CompanyId: company.id } });
    const ledgerCount = await Ledger.count({ where: { CompanyId: company.id } });

    res.json({
      ...company.toJSON(),
      groupCount,
      ledgerCount
    });
  } catch (err) {
    next(err);
  }
};

exports.updateCompany = async (req, res, next) => {
  try {
    const { gstNumber, panNumber } = req.body;
    if (gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber)) {
      return res.status(400).json({ error: 'Invalid GST Number format. Must be 15 characters like 33ABCDE1234F1Z5' });
    }
    if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
      return res.status(400).json({ error: 'Invalid PAN Number format. Must be 10 characters like ABCDE1234F' });
    }

    const fieldsToUpdate = [
      'name', 'gstNumber', 'address', 'features', 'financialYearStart', 
      'booksBeginningFrom', 'industry', 'location', 'street1', 'street2', 
      'city', 'pincode', 'phone', 'faxNumber', 'website', 'baseCurrency', 
      'fiscalYear', 'reportBasis', 'language', 'timezone', 'dateFormat', 
      'organizationId', 'logoUrl', 'additionalFields', 'state', 'panNumber'
    ];
    
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    if (req.user.role !== 'SUPER_ADMIN') {
      const user = await User.findByPk(req.user.id, {
        include: [Company]
      });
      const hasAccess = user.Companies && user.Companies.some(c => c.id === company.id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied: You do not have access to this company' });
      }
    }

    if (req.body.gstNumber) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(req.body.gstNumber.toUpperCase())) {
        return res.status(400).json({ error: 'Invalid GSTIN format. Expected format: 33AAAAA1111A1Z1' });
      }
    }
    if (req.body.panNumber) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(req.body.panNumber.toUpperCase())) {
        return res.status(400).json({ error: 'Invalid PAN format. Expected format: ABCDE1234F' });
      }
    }

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'features') {
          company.features = { ...company.features, ...req.body.features };
        } else {
          company[field] = req.body[field];
        }
      }
    });

    await company.save();
    res.json(company);
  } catch (err) {
    next(err);
  }
};

exports.closeFinancialYear = async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await Company.findByPk(id);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    if (req.user.role !== 'SUPER_ADMIN') {
      const user = await User.findByPk(req.user.id, {
        include: [Company]
      });
      const hasAccess = user.Companies && user.Companies.some(c => c.id === company.id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied: You do not have access to this company' });
      }
    }

    // 1. Fetch all ledger groups for the company
    const groups = await Group.findAll({ where: { CompanyId: id } });
    const groupMap = {};
    groups.forEach(g => { groupMap[g.id] = g; });

    // 2. Fetch all ledgers
    const ledgers = await Ledger.findAll({ where: { CompanyId: id } });

    let netProfit = 0;
    const incomeLedgers = [];
    const expenseLedgers = [];
    const assetLiabilityLedgers = [];

    ledgers.forEach(l => {
      const grp = groupMap[l.GroupId];
      const nature = grp?.nature || l.category || '';
      
      // Calculate net profit/loss closing balance
      if (nature === 'Income') {
        netProfit += parseFloat(l.currentBalance || 0);
        incomeLedgers.push(l);
      } else if (nature === 'Expenses') {
        netProfit -= parseFloat(l.currentBalance || 0);
        expenseLedgers.push(l);
      } else {
        assetLiabilityLedgers.push(l);
      }
    });

    // 3. Find or create a Retained Earnings / Reserves & Surplus ledger
    let retainedEarningsLedger = ledgers.find(l => l.name === 'Retained Earnings');
    if (!retainedEarningsLedger) {
      const reservesGroup = groups.find(g => g.name.includes('Reserves') || g.name.includes('Capital'));
      retainedEarningsLedger = await Ledger.create({
        name: 'Retained Earnings',
        code: 'CAP-RE',
        category: 'Liability',
        groupName: reservesGroup ? reservesGroup.name : 'Capital Account',
        GroupId: reservesGroup ? reservesGroup.id : null,
        CompanyId: id,
        currentBalance: 0,
        openingBalance: 0
      });
    }

    // 4. Update Retained Earnings with net profit
    retainedEarningsLedger.currentBalance = parseFloat(retainedEarningsLedger.currentBalance || 0) + netProfit;
    retainedEarningsLedger.openingBalance = parseFloat(retainedEarningsLedger.openingBalance || 0) + netProfit;
    await retainedEarningsLedger.save();

    // 5. Reset Income & Expense ledgers to 0 current balance and 0 opening balance
    for (const l of incomeLedgers) {
      l.currentBalance = 0;
      l.openingBalance = 0;
      await l.save();
    }
    for (const l of expenseLedgers) {
      l.currentBalance = 0;
      l.openingBalance = 0;
      await l.save();
    }

    // 6. Carry forward asset & liability balances as opening balances for the next year
    for (const l of assetLiabilityLedgers) {
      l.openingBalance = l.currentBalance;
      await l.save();
    }

    // 7. Update financial year start in company model to the next year
    const currentFYStart = new Date(company.financialYearStart || new Date());
    const nextFYStart = new Date(currentFYStart);
    nextFYStart.setFullYear(currentFYStart.getFullYear() + 1);
    company.financialYearStart = nextFYStart;
    await company.save();

    // 8. Create Audit Log
    const { AuditLog } = require('../../models');
    await AuditLog.create({
      action: 'CLOSE_FINANCIAL_YEAR',
      tableName: 'Companies',
      recordId: id,
      newData: {
        closedYearStart: currentFYStart.toISOString(),
        nextYearStart: nextFYStart.toISOString(),
        netProfitTransferred: netProfit
      },
      CompanyId: id,
      UserId: req.user?.id
    });

    res.json({
      message: 'Financial year closed successfully. Balances carried forward.',
      netProfit,
      nextFinancialYearStart: nextFYStart
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await Company.findByPk(id);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    if (req.user.role !== 'SUPER_ADMIN' && company.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: Only the owner or SUPER_ADMIN can delete this company' });
    }

    await company.destroy();
    res.json({ message: 'Company deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.seedGroupsForCompany = async (req, res, next) => {
  try {
    const companyId = req.params.id;
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const count = await Group.count({ where: { CompanyId: companyId } });
    if (count > 0) {
      return res.status(400).json({ error: `Company already has ${count} groups. Seeding aborted.` });
    }

    await exports.seedDefaultGroups(companyId);

    const finalCount = await Group.count({ where: { CompanyId: companyId } });
    res.json({ 
      message: 'Default Tally standard groups seeded successfully', 
      count: finalCount 
    });
  } catch (err) {
    next(err);
  }
};

exports.syncDefaultLedgers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await Company.findByPk(id);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    if (req.user.role !== 'SUPER_ADMIN') {
      const user = await User.findByPk(req.user.id, { include: [Company] });
      const hasAccess = user.Companies && user.Companies.some(c => c.id === company.id);
      if (!hasAccess) return res.status(403).json({ error: 'Access denied' });
    }

    await exports.seedDefaultLedgers(id);
    res.json({ message: 'Default ledgers synced successfully' });
  } catch (err) {
    next(err);
  }
};