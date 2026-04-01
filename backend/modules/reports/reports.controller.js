const { Ledger, Group, Transaction, Voucher, sequelize } = require('../../models');
const { Op } = require('sequelize');

/**
 * TRIAL BALANCE
 * Lists every ledger with its total debit, total credit, and closing balance.
 * Tally formula: Closing = Opening + TotalDebit - TotalCredit
 */
exports.getTrialBalance = async (req, res) => {
  try {
    const { companyId } = req.params;

    const ledgers = await Ledger.findAll({
      where: { CompanyId: companyId },
      include: [
        { model: Group, attributes: ['name', 'nature'] },
        {
          model: Transaction,
          attributes: []
        }
      ],
      attributes: {
        include: [
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('Transactions.debit')), 0), 'totalDebit'],
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('Transactions.credit')), 0), 'totalCredit']
        ]
      },
      group: ['Ledger.id', 'Group.id'],
      raw: true,
      nest: true
    });

    const trialBalance = ledgers.map(l => {
      const opening = parseFloat(l.openingBalance || 0);
      const debit = parseFloat(l.totalDebit || 0);
      const credit = parseFloat(l.totalCredit || 0);
      const closing = opening + debit - credit;

      return {
        ledgerId: l.id,
        ledgerName: l.name,
        group: l.Group?.name || 'Ungrouped',
        nature: l.Group?.nature || 'Unknown',
        openingBalance: opening,
        totalDebit: debit,
        totalCredit: credit,
        closingBalance: closing
      };
    });

    // Summary
    const totalDebitSum = trialBalance.reduce((s, r) => s + r.totalDebit, 0);
    const totalCreditSum = trialBalance.reduce((s, r) => s + r.totalCredit, 0);

    res.json({
      trialBalance,
      summary: {
        totalDebit: totalDebitSum,
        totalCredit: totalCreditSum,
        isBalanced: Math.abs(totalDebitSum - totalCreditSum) < 0.01
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PROFIT & LOSS STATEMENT
 * Income - Expenses = Net Profit/Loss
 */
exports.getProfitAndLoss = async (req, res) => {
  try {
    const { companyId } = req.params;

    const ledgers = await Ledger.findAll({
      where: { CompanyId: companyId },
      include: [
        { model: Group, attributes: ['name', 'nature'], where: { nature: { [Op.in]: ['Income', 'Expenses'] } } },
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
      nest: true
    });

    const income = [];
    const expenses = [];
    let totalIncome = 0;
    let totalExpenses = 0;

    ledgers.forEach(l => {
      const amount = parseFloat(l.totalCredit || 0) - parseFloat(l.totalDebit || 0);
      const entry = { name: l.name, group: l.Group?.name, amount: Math.abs(amount) };

      if (l.Group?.nature === 'Income') {
        income.push(entry);
        totalIncome += entry.amount;
      } else {
        expenses.push(entry);
        totalExpenses += entry.amount;
      }
    });

    res.json({
      income,
      expenses,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * BALANCE SHEET
 * Assets = Liabilities + Equity (Capital)
 */
exports.getBalanceSheet = async (req, res) => {
  try {
    const { companyId } = req.params;

    const ledgers = await Ledger.findAll({
      where: { CompanyId: companyId },
      include: [
        { model: Group, attributes: ['name', 'nature'], where: { nature: { [Op.in]: ['Assets', 'Liabilities'] } } },
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
      nest: true
    });

    const assets = [];
    const liabilities = [];
    let totalAssets = 0;
    let totalLiabilities = 0;

    // 1. Map Ledgers to Assets/Liabilities
    ledgers.forEach(l => {
      // Determine if opening balance is Debit or Credit
      let opening = parseFloat(l.openingBalance || 0);
      if (l.openingBalanceType === 'Cr') {
        opening = -opening;
      } else if (!l.openingBalanceType && l.Group?.nature === 'Liabilities') {
        opening = -opening;
      }

      // closing > 0 means Debit balance, closing < 0 means Credit balance
      const closing = opening + parseFloat(l.totalDebit || 0) - parseFloat(l.totalCredit || 0);
      const absBalance = Math.abs(closing);
      
      const entry = { ledgerId: l.id, ledgerName: l.name, group: l.Group?.name, balance: absBalance };

      if (closing > 0.01) {
        assets.push(entry);
        totalAssets += absBalance;
      } else if (closing < -0.01) {
        liabilities.push(entry);
        totalLiabilities += absBalance;
      } else {
        // For Exactly 0 balances, put them in their natural group for display
        if (l.Group?.nature === 'Assets') {
          assets.push(entry);
        } else {
          liabilities.push(entry);
        }
      }
    });

    // 2. Fetch Net Profit to make the BS Balance (Crucial Step)
    const incomeLedgers = await Ledger.findAll({
      where: { CompanyId: companyId },
      include: [{ model: Group, where: { nature: { [Op.in]: ['Income', 'Expenses'] } } }, { model: Transaction, attributes: [] }],
      attributes: {
        include: [
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('Transactions.debit')), 0), 'totalDebit'],
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('Transactions.credit')), 0), 'totalCredit']
        ]
      },
      group: ['Ledger.id', 'Group.id'],
      raw: true, nest: true
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    incomeLedgers.forEach(l => {
      const amount = parseFloat(l.totalCredit || 0) - parseFloat(l.totalDebit || 0);
      if (l.Group?.nature === 'Income') totalIncome += amount;
      else totalExpenses += Math.abs(amount);
    });

    const netProfit = totalIncome - totalExpenses;
    
    // 3. Inject Profit/Loss into Liabilities side
    if (netProfit !== 0) {
      liabilities.push({
        ledgerName: netProfit > 0 ? 'Profit & Loss A/c (Profit)' : 'Profit & Loss A/c (Loss)',
        group: 'RETAINED EARNINGS',
        balance: Math.abs(netProfit)
      });
      totalLiabilities += Math.abs(netProfit);
    }

    res.json({
      assets,
      liabilities,
      totalAssets,
      totalLiabilities,
      netProfit,
      isBalanced: Math.abs(totalAssets - totalLiabilities) < 0.01
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * DAYBOOK — All vouchers for a date range
 */
exports.getDaybook = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { from, to } = req.query;

    const where = { CompanyId: companyId };
    if (from && to) {
      where.date = { [Op.between]: [new Date(from), new Date(to)] };
    }

    const vouchers = await Voucher.findAll({
      where,
      include: [{
        model: Transaction,
        include: [{ model: Ledger, attributes: ['name'] }]
      }],
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json(vouchers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const { AuditLog, User } = require('../../models');
    const logs = await AuditLog.findAll({
      where: { CompanyId: req.params.companyId },
      include: [{ model: User, attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: 100 // Last 100 activities
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * DASHBOARD STATS — Real financial overview
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const { companyId } = req.params;

    const safeCount = async (model, where) => {
      try { return await model.count({ where }); } catch { return 0; }
    };

    const [voucherCount, ledgerCount] = await Promise.all([
      safeCount(Voucher, { CompanyId: companyId }),
      safeCount(Ledger, { CompanyId: companyId }),
    ]);

    // Get all ledgers with their transaction sums
    const ledgers = await Ledger.findAll({
      where: { CompanyId: companyId },
      include: [
        { model: Group, attributes: ['name', 'nature'] },
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
      nest: true
    });

    let totalIncome = 0, totalExpenses = 0, cashBalance = 0;

    ledgers.forEach(l => {
      const nature = l.Group?.nature || '';
      const opening = parseFloat(l.openingBalance || 0);
      const debit = parseFloat(l.totalDebit || 0);
      const credit = parseFloat(l.totalCredit || 0);
      const closing = opening + debit - credit;

      if (nature === 'Income') totalIncome += credit - debit + opening;
      if (nature === 'Expenses') totalExpenses += debit - credit + opening;
      // Cash/Bank ledgers
      const name = (l.name || '').toLowerCase();
      if (name.includes('cash') || name.includes('bank')) cashBalance += closing;
    });

    res.json({
      voucherCount,
      ledgerCount,
      totalIncome: Math.max(0, totalIncome),
      totalExpenses: Math.max(0, totalExpenses),
      netProfit: totalIncome - totalExpenses,
      cashBalance,
      receivables: 0,
      payables: 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * LEDGER STATEMENT — Running balance for a single ledger
 */
exports.getLedgerStatement = async (req, res) => {
  try {
    const { ledgerId } = req.params;
    const { from, to } = req.query;

    const ledger = await Ledger.findByPk(ledgerId, {
      include: [{ model: Group, attributes: ['name', 'nature'] }]
    });
    if (!ledger) return res.status(404).json({ error: 'Ledger not found' });

    const where = { LedgerId: ledgerId };
    if (from && to) where.createdAt = { [Op.between]: [new Date(from), new Date(to)] };

    const transactions = await Transaction.findAll({
      where,
      include: [{
        model: Voucher,
        attributes: ['voucherNumber', 'voucherType', 'date', 'narration']
      }],
      order: [['createdAt', 'ASC']]
    });

    let runningBalance = parseFloat(ledger.openingBalance || 0);
    const entries = transactions.map(t => {
      const debit = parseFloat(t.debit || 0);
      const credit = parseFloat(t.credit || 0);
      runningBalance += debit - credit;
      return {
        id: t.id,
        date: t.Voucher?.date || t.createdAt,
        voucherNumber: t.Voucher?.voucherNumber || '—',
        voucherType: t.Voucher?.voucherType || '—',
        narration: t.Voucher?.narration || t.narration || '—',
        debit,
        credit,
        balance: runningBalance,
      };
    });

    res.json({
      ledger: {
        id: ledger.id,
        name: ledger.name,
        group: ledger.Group?.name,
        nature: ledger.Group?.nature,
        openingBalance: parseFloat(ledger.openingBalance || 0),
        closingBalance: runningBalance,
      },
      entries
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
