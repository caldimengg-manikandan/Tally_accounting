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
