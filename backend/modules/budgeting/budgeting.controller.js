const { Budget, BudgetItem, Ledger, Group, Transaction, Voucher, sequelize } = require('../../models');
const { Op } = require('sequelize');

// Helper to parse fiscal year strings into date ranges
const parseFiscalYearRange = (fy) => {
  let startYear = 2026;
  let endYear = 2027;

  if (fy && fy.includes(' - ')) {
    // Format: "Apr 2026 - Mar 2027"
    const parts = fy.split(' - ');
    const startPart = parts[0].trim(); // "Apr 2026"
    const endPart = parts[1].trim();   // "Mar 2027"
    
    const syStr = startPart.split(' ')[1];
    const eyStr = endPart.split(' ')[1];
    
    if (syStr) startYear = parseInt(syStr);
    if (eyStr) endYear = parseInt(eyStr);
  } else if (fy && fy.includes('-')) {
    // Format: "2026-2027"
    const parts = fy.split('-');
    startYear = parseInt(parts[0]);
    endYear = parseInt(parts[1]);
  }

  return {
    startDate: `${startYear}-04-01T00:00:00.000Z`,
    endDate: `${endYear}-03-31T23:59:59.999Z`
  };
};

// Create Budget
exports.createBudget = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, fiscalYear, period, items, companyId } = req.body;

    const budget = await Budget.create({
      name,
      fiscalYear,
      period: period || 'Monthly',
      CompanyId: companyId
    }, { transaction: t });

    if (items && Array.isArray(items) && items.length > 0) {
      const budgetItems = items.map(it => ({
        BudgetId: budget.id,
        LedgerId: it.ledgerId || null,
        GroupId: it.groupId || null,
        targetAmount: parseFloat(it.targetAmount || 0),
        CompanyId: companyId
      }));
      await BudgetItem.bulkCreate(budgetItems, { transaction: t });
    }

    await t.commit();
    res.status(201).json(budget);
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ error: err.message });
  }
};

// Get Budgets
exports.getBudgets = async (req, res) => {
  try {
    const { companyId } = req.params;
    const budgets = await Budget.findAll({
      where: { CompanyId: companyId },
      include: [{
        model: BudgetItem,
        as: 'items',
        include: [
          { model: Ledger, attributes: ['name'] },
          { model: Group, attributes: ['name'] }
        ]
      }]
    });
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Budget
exports.deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findByPk(req.params.id);
    if (!budget) return res.status(404).json({ error: 'Budget not found' });
    await budget.destroy();
    res.json({ message: 'Budget deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Budget vs Actual Variance Report
exports.getBudgetVariance = async (req, res) => {
  try {
    const { id } = req.params; // budgetId

    const budget = await Budget.findByPk(id, {
      include: [{
        model: BudgetItem,
        as: 'items',
        include: [
          { 
            model: Ledger, 
            attributes: ['id', 'name', 'openingBalance', 'openingBalanceType'],
            include: [{ model: Group, attributes: ['nature'] }]
          },
          {
            model: Group,
            attributes: ['id', 'name', 'nature']
          }
        ]
      }]
    });

    if (!budget) return res.status(404).json({ error: 'Budget not found' });

    const { startDate, endDate } = parseFiscalYearRange(budget.fiscalYear);

    const reports = [];

    // Get all groups for recursive lookup
    const allGroups = await Group.findAll({ where: { CompanyId: budget.CompanyId }, raw: true });

    const getDescendantGroupIds = (parentGroupId) => {
      const ids = [parentGroupId];
      const queue = [parentGroupId];
      while (queue.length > 0) {
        const currentId = queue.shift();
        const children = allGroups.filter(g => g.parent_id === currentId);
        children.forEach(child => {
          if (!ids.includes(child.id)) {
            ids.push(child.id);
            queue.push(child.id);
          }
        });
      }
      return ids;
    };

    for (const item of budget.items) {
      let ledgersInGroup = [];

      if (item.GroupId) {
        const descendantGroupIds = getDescendantGroupIds(item.GroupId);
        ledgersInGroup = await Ledger.findAll({
          where: { GroupId: { [Op.in]: descendantGroupIds } },
          include: [{ model: Group, attributes: ['nature'] }]
        });
      } else if (item.LedgerId && item.Ledger) {
        ledgersInGroup = [item.Ledger];
      }

      let totalDebit = 0;
      let totalCredit = 0;
      let totalOpening = 0;

      for (const led of ledgersInGroup) {
        const txs = await Transaction.findAll({
          where: {
            LedgerId: led.id,
            createdAt: { [Op.between]: [startDate, endDate] }
          },
          include: [{
            model: Voucher,
            where: { date: { [Op.between]: [startDate, endDate] } },
            attributes: []
          }]
        });

        totalDebit += txs.reduce((sum, t) => sum + parseFloat(t.debit || 0), 0);
        totalCredit += txs.reduce((sum, t) => sum + parseFloat(t.credit || 0), 0);

        const nature = led.Group?.nature || 'Expenses';
        const opBalance = parseFloat(led.openingBalance || 0);
        const opType = (led.openingBalanceType || 'Dr').trim().toUpperCase();

        if (nature === 'Expenses' || nature === 'Assets') {
          totalOpening += opType === 'DR' ? opBalance : -opBalance;
        } else {
          totalOpening += opType === 'CR' ? opBalance : -opBalance;
        }
      }

      const nature = item.GroupId ? item.Group?.nature : item.Ledger?.Group?.nature;
      const isDr = nature === 'Expenses' || nature === 'Assets';
      
      let actualAmount = 0;
      if (isDr) {
        actualAmount = totalDebit - totalCredit;
      } else {
        actualAmount = totalCredit - totalDebit;
      }
      actualAmount += totalOpening;
      actualAmount = Math.max(0, actualAmount);

      const target = parseFloat(item.targetAmount || 0);
      const variance = target - actualAmount;
      const pctAchieved = target > 0 ? (actualAmount / target) * 100 : 0;

      reports.push({
        ledgerId: item.LedgerId,
        groupId: item.GroupId,
        name: item.GroupId ? item.Group?.name : item.Ledger?.name,
        type: item.GroupId ? 'Group' : 'Ledger',
        targetAmount: target,
        actualAmount: parseFloat(actualAmount.toFixed(2)),
        variance: parseFloat(variance.toFixed(2)),
        pctAchieved: parseFloat(pctAchieved.toFixed(2))
      });
    }

    res.json({
      budget: {
        id: budget.id,
        name: budget.name,
        fiscalYear: budget.fiscalYear,
        period: budget.period
      },
      items: reports
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

