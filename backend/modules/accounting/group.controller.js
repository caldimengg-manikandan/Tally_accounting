const { Group, Company } = require('../../models');
const { standardGroups } = require('../../helpers/tallyGroups');
const { Op } = require('sequelize');

/**
 * Auto-resolve: finds the first company, seeds groups if empty,
 * and returns { companyId, groups }. Used by the frontend to
 * self-heal a stale localStorage companyId.
 */
exports.resolveCompanyGroups = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const company = await Company.findByPk(companyId);
    if (!company) return res.status(404).json({ error: 'Company not found.' });

    let groups = await Group.findAll({
      where: { 
        CompanyId: company.id,
        name: { [Op.ne]: 'Suspense Account' }
      },
      order: [['nature', 'ASC'], ['name', 'ASC']]
    });

    // Auto-seed if empty
    if (groups.length === 0) {
      const primaryGroups = standardGroups.filter(g => !g.parent);
      const groupMap = {};
      for (const g of primaryGroups) {
        const c = await Group.create({ name: g.name, nature: g.nature, category: 'Primary', CompanyId: company.id });
        groupMap[g.name] = c.id;
      }
      for (const g of standardGroups.filter(g => g.parent)) {
        await Group.create({ name: g.name, nature: g.nature, category: 'Sub-Group', parent_id: groupMap[g.parent] || null, CompanyId: company.id });
      }
      groups = await Group.findAll({ where: { CompanyId: company.id }, order: [['nature', 'ASC'], ['name', 'ASC']] });
    }

    res.json({ companyId: company.id, companyName: company.name, groups });
  } catch (err) {
    next(err);
  }
};


// Create a group under a company
exports.createGroup = async (req, res, next) => {
  try {
    const { companyId, CompanyId, name, nature, category, parentId, parent_id } = req.body;
    const targetCompanyId = req.companyId || companyId || CompanyId;
    const group = await Group.create({
      name,
      nature,
      category: category || 'Sub-Group',
      parent_id: parentId || parent_id || null,
      CompanyId: targetCompanyId
    });
    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
};

// Get all groups for a company (hierarchical)
exports.getGroups = async (req, res, next) => {
  try {
    const { Ledger, Transaction, sequelize } = require('../../models');
    const { Op } = require('sequelize');

    const fetchGroupsWithBalances = async (companyId) => {
      // Fetch ledger transaction sums for this company in one query
      const ledgerTotals = await Ledger.findAll({
        where: { CompanyId: companyId },
        include: [{ model: Transaction, attributes: [] }],
        attributes: {
          include: [
            [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('Transactions.debit')), 0), 'totalDebit'],
            [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('Transactions.credit')), 0), 'totalCredit']
          ]
        },
        group: ['Ledger.id'],
        raw: true
      });
      const totalsMap = {};
      ledgerTotals.forEach(l => { totalsMap[l.id] = { totalDebit: l.totalDebit, totalCredit: l.totalCredit }; });

      // Fetch groups with Ledgers
      const groups = await Group.findAll({
        where: { 
          CompanyId: companyId,
          name: { [Op.ne]: 'Suspense Account' }
        },
        include: [
          { model: Group, as: 'SubGroups' },
          { model: Ledger, as: 'Ledgers' }
        ],
        order: [['name', 'ASC']]
      });

      // Attach transaction totals to each ledger
      return groups.map(g => {
        const gj = g.toJSON();
        if (gj.Ledgers) {
          gj.Ledgers = gj.Ledgers.map(l => ({
            ...l,
            totalDebit: parseFloat(totalsMap[l.id]?.totalDebit || 0),
            totalCredit: parseFloat(totalsMap[l.id]?.totalCredit || 0)
          }));
        }
        return gj;
      });
    };

    let groups = await fetchGroupsWithBalances(req.params.companyId);

    // Self-healing: Auto-seed standard groups if they are empty
    if (groups.length === 0) {
      const primaryGroups = standardGroups.filter(g => !g.parent);
      const groupMap = {};
      for (const g of primaryGroups) {
        const c = await Group.create({
          name: g.name,
          nature: g.nature,
          category: 'Primary',
          CompanyId: req.params.companyId
        });
        groupMap[g.name] = c.id;
      }
      for (const g of standardGroups.filter(g => g.parent)) {
        await Group.create({
          name: g.name,
          nature: g.nature,
          category: 'Sub-Group',
          parent_id: groupMap[g.parent] || null,
          CompanyId: req.params.companyId
        });
      }
      groups = await fetchGroupsWithBalances(req.params.companyId);
    }

    res.json(groups);
  } catch (err) {
    next(err);
  }
};


// Seed the 24 standard Tally groups for a company
exports.seedGroups = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    if (!companyId || companyId === 'null' || companyId === 'undefined') {
      return res.status(400).json({ error: 'Valid Company ID is required.' });
    }

    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found. Please select a valid company.' });
    }

    // Check if groups already exist for this company
    const existing = await Group.count({ where: { CompanyId: companyId } });
    if (existing > 0) {
      return res.status(400).json({ error: 'Groups already initialized for this company.' });
    }

    // First pass: create primary groups (no parent)
    const primaryGroups = standardGroups.filter(g => !g.parent);
    const groupMap = {};

    for (const g of primaryGroups) {
      const created = await Group.create({
        name: g.name,
        nature: g.nature,
        category: 'Primary',
        CompanyId: companyId
      });
      groupMap[g.name] = created.id;
    }

    // Second pass: create sub-groups (with parent)
    const subGroups = standardGroups.filter(g => g.parent);
    for (const g of subGroups) {
      await Group.create({
        name: g.name,
        nature: g.nature,
        category: 'Sub-Group',
        parent_id: groupMap[g.parent] || null,
        CompanyId: companyId
      });
    }

    const allGroups = await Group.findAll({
      where: { CompanyId: companyId },
      order: [['nature', 'ASC'], ['name', 'ASC']]
    });

    res.status(201).json({ message: `${allGroups.length} groups created.`, groups: allGroups });
  } catch (err) {
    next(err);
  }
};

// Update a group
exports.updateGroup = async (req, res, next) => {
  try {
    const { name, nature, category, parentId } = req.body;
    const group = await Group.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    
    await group.update({ name, nature, category, parent_id: parentId });
    res.json(group);
  } catch (err) {
    next(err);
  }
};

// Delete a group (only if no subgroups or ledgers attached)
exports.deleteGroup = async (req, res, next) => {
  try {
    const { Ledger } = require('../../models');
    const ledgerCount = await Ledger.count({ where: { GroupId: req.params.id } });
    const subGroupCount = await Group.count({ where: { parent_id: req.params.id } });
    
    if (ledgerCount > 0 || subGroupCount > 0) {
      return res.status(400).json({ error: 'Cannot delete group with existing ledgers or subgroups.' });
    }
    
    await Group.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Group deleted.' });
  } catch (err) {
    next(err);
  }
};
