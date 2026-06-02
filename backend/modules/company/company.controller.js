const { Company, User, Group, Ledger } = require('../../models');

exports.createCompany = async (req, res) => {
  try {
    const { 
      name, gstNumber, address, financialYearStart, booksBeginningFrom, userId,
      industry, location, street1, street2, city, pincode, phone, faxNumber,
      website, baseCurrency, fiscalYear, reportBasis, language, timezone,
      dateFormat, organizationId, logoUrl, additionalFields, state, panNumber
    } = req.body;

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
      panNumber
    });
    
    const user = req.user || (userId ? await User.findByPk(userId) : null);
    if (user) {
      await company.addUser(user);
      
      // Auto-set as active company if user doesn't have one
      if (!user.activeCompanyId) {
        user.activeCompanyId = company.id;
        await user.save();
      }
    }

    // Auto-seed Tally standard groups for the newly created company
    const { standardGroups } = require('../../helpers/tallyGroups');
    const primaryGroups = standardGroups.filter(g => !g.parent);
    const groupMap = {};
    for (const g of primaryGroups) {
      const created = await Group.create({
        name: g.name,
        nature: g.nature,
        category: 'Primary',
        CompanyId: company.id
      });
      groupMap[g.name] = created.id;
    }
    const subGroups = standardGroups.filter(g => g.parent);
    for (const g of subGroups) {
      await Group.create({
        name: g.name,
        nature: g.nature,
        category: 'Sub-Group',
        parent_id: groupMap[g.parent] || null,
        CompanyId: company.id
      });
    }
    
    res.status(201).json({
      ...company.toJSON(),
      message: 'Company created and set as active'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCompanies = async (req, res) => {
  try {
    let companies;
    if (req.user) {
      if (req.user.role === 'SUPER_ADMIN') {
        companies = await Company.findAll({ order: [['createdAt', 'ASC']] });
      } else {
        const userInstance = await User.findByPk(req.user.id);
        if (!userInstance) {
          return res.status(404).json({ error: 'User not found' });
        }
        companies = await userInstance.getCompanies({
          order: [['createdAt', 'ASC']]
        });
      }

      // Special rescue: If ADMIN or SUPER_ADMIN has no linked companies, show all existing ones
      if (companies.length === 0 && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN')) {
        companies = await Company.findAll({
          order: [['createdAt', 'ASC']]
        });
      }
    } else {
      companies = await Company.findAll({
        order: [['createdAt', 'ASC']]
      });
    }
    // Attach counts
    const result = await Promise.all(companies.map(async (c) => ({
      ...c.toJSON(),
      groupCount: await Group.count({ where: { CompanyId: c.id } }),
      ledgerCount: await Ledger.count({ where: { CompanyId: c.id } }),
    })));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id, {
      include: [User]
    });
    if (!company) return res.status(404).json({ error: 'Company not found' });

    // Get counts
    const groupCount = await Group.count({ where: { CompanyId: company.id } });
    const ledgerCount = await Ledger.count({ where: { CompanyId: company.id } });

    res.json({
      ...company.toJSON(),
      groupCount,
      ledgerCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const fieldsToUpdate = [
      'name', 'gstNumber', 'address', 'features', 'financialYearStart', 
      'booksBeginningFrom', 'industry', 'location', 'street1', 'street2', 
      'city', 'pincode', 'phone', 'faxNumber', 'website', 'baseCurrency', 
      'fiscalYear', 'reportBasis', 'language', 'timezone', 'dateFormat', 
      'organizationId', 'logoUrl', 'additionalFields', 'state', 'panNumber'
    ];
    
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });

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
    res.status(500).json({ error: err.message });
  }
};

exports.closeFinancialYear = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findByPk(id);
    if (!company) return res.status(404).json({ error: 'Company not found' });

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
    res.status(500).json({ error: err.message });
  }
};

