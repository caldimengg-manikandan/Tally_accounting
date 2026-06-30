const express = require('express');
const router = express.Router();
const accountingService = require('./accounting.service');
const { verifyToken, tenantAccess } = require('../../middleware/auth.middleware');

router.use(verifyToken, tenantAccess);

router.post('/calculate-gst', async (req, res, next) => {
  try {
    const { amount, rate, ledgerId, companyId } = req.body;
    const { Company, Ledger } = require('../../models');
    
    const company = await Company.findByPk(companyId);
    const ledger = await Ledger.findByPk(ledgerId);

    if (!company || !ledger) {
      return res.status(404).json({ error: 'Company or Ledger not found for GST calculation.' });
    }

    const isInterstate = company.state !== ledger.state;
    const result = accountingService.calculateProfessionalGST(amount, rate, isInterstate);
    
    res.json({ ...result, isInterstate, companyState: company.state, ledgerState: ledger.state });
  } catch (err) {
    next(err);
  }
});

router.post('/scan-receipt', async (req, res) => {
  const result = await accountingService.simulateAIOCR(req.body.fileName);
  res.json(result);
});

// ── TOOL-01: Financial Year Closing Endpoint ─────────────────────────────
router.post('/close-financial-year', async (req, res, next) => {
  const { Ledger, Group, Transaction, Voucher, sequelize } = require('../../models');
  const AccountingService = require('../../services/AccountingService');
  const { Op } = require('sequelize');

  const t = await sequelize.transaction();
  try {
    const { companyId, closingDate } = req.body;
    if (!companyId || !closingDate) {
      await t.rollback();
      return res.status(400).json({ error: 'companyId and closingDate are required.' });
    }

    const endOfClosingDate = new Date(closingDate);
    endOfClosingDate.setHours(23, 59, 59, 999);

    // 1. Fetch all Income and Expense groups
    const groups = await Group.findAll({
      where: { CompanyId: companyId, nature: { [Op.in]: ['Income', 'Expenses'] } },
      transaction: t
    });

    if (groups.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'No Income/Expense groups found for this company.' });
    }

    const groupIds = groups.map(g => g.id);

    const ledgers = await Ledger.findAll({
      where: { CompanyId: companyId, GroupId: { [Op.in]: groupIds } },
      transaction: t
    });

    if (ledgers.length === 0) {
      await t.rollback();
      return res.status(200).json({ message: 'No Income/Expense ledgers found. Books are already clean.' });
    }

    // 2. Fetch all transaction lines up to closing date for these ledgers
    const txs = await Transaction.findAll({
      include: [{
        model: Voucher,
        where: {
          CompanyId: companyId,
          date: { [Op.lte]: endOfClosingDate }
        },
        required: true
      }],
      transaction: t
    });

    const ledgerTotals = {};
    ledgers.forEach(l => {
      ledgerTotals[l.id] = { debit: 0, credit: 0 };
    });

    txs.forEach(tx => {
      if (ledgerTotals[tx.LedgerId]) {
        ledgerTotals[tx.LedgerId].debit += parseFloat(tx.debit || 0);
        ledgerTotals[tx.LedgerId].credit += parseFloat(tx.credit || 0);
      }
    });

    // 3. Form entries to zero them out
    const entries = [];
    let netProfitLoss = 0; // Income (Cr) - Expenses (Dr)

    for (const ledger of ledgers) {
      const totals = ledgerTotals[ledger.id];
      const opening = parseFloat(ledger.openingBalance || 0);
      const opType = (ledger.openingBalanceType || 'Dr').trim().toUpperCase();
      const opSigned = opType === 'CR' ? -opening : opening;

      // Cumulative balance
      const balance = opSigned + totals.debit - totals.credit;

      if (Math.abs(balance) < 0.01) continue;

      if (balance > 0) {
        // Debit balance (Expense) -> Credit it to zero it out
        entries.push({
          ledgerId: ledger.id,
          debit: 0,
          credit: balance,
          description: `FY Closing - Zeroing out expense ledger ${ledger.name}`
        });
        netProfitLoss -= balance; 
      } else {
        // Credit balance (Income) -> Debit it to zero it out
        entries.push({
          ledgerId: ledger.id,
          debit: Math.abs(balance),
          credit: 0,
          description: `FY Closing - Zeroing out income ledger ${ledger.name}`
        });
        netProfitLoss += Math.abs(balance);
      }
    }

    if (entries.length === 0) {
      await t.rollback();
      return res.status(200).json({ message: 'All Income & Expense accounts are already at zero balance.' });
    }

    // 4. Find/create Retained Earnings ledger under Capital Account group
    let capitalGroup = await Group.findOne({
      where: { CompanyId: companyId, name: { [Op.like]: '%Capital%' } },
      transaction: t
    });

    if (!capitalGroup) {
      capitalGroup = await Group.create({
        CompanyId: companyId,
        name: 'Capital Account',
        nature: 'Liabilities',
        parent_id: null
      }, { transaction: t });
    }

    let retainedEarnings = await Ledger.findOne({
      where: { CompanyId: companyId, name: 'Retained Earnings' },
      transaction: t
    });

    if (!retainedEarnings) {
      retainedEarnings = await Ledger.create({
        CompanyId: companyId,
        name: 'Retained Earnings',
        GroupId: capitalGroup.id,
        openingBalance: 0,
        openingBalanceType: 'Cr',
        currentBalance: 0
      }, { transaction: t });
    }

    // 5. Post balancing entry to Retained Earnings
    if (netProfitLoss > 0) {
      // Income exceeded Expenses (Net Profit) -> Credit Retained Earnings
      entries.push({
        ledgerId: retainedEarnings.id,
        debit: 0,
        credit: netProfitLoss,
        description: `FY Closing - Transferring Net Profit to Retained Earnings`
      });
    } else if (netProfitLoss < 0) {
      // Expenses exceeded Income (Net Loss) -> Debit Retained Earnings
      entries.push({
        ledgerId: retainedEarnings.id,
        debit: Math.abs(netProfitLoss),
        credit: 0,
        description: `FY Closing - Transferring Net Loss to Retained Earnings`
      });
    }

    // Double check balancing
    const totalDr = entries.reduce((s, e) => s + (e.debit || 0), 0);
    const totalCr = entries.reduce((s, e) => s + (e.credit || 0), 0);
    if (Math.abs(totalDr - totalCr) > 0.01) {
      await t.rollback();
      return res.status(500).json({ error: `INTEGRITY ERROR: FY Closing journal entry is unbalanced. Dr: ₹${totalDr}, Cr: ₹${totalCr}` });
    }

    const closeVoucher = await AccountingService.recordJournalEntry({
      companyId,
      date: endOfClosingDate,
      voucherType: 'Journal',
      narration: `Financial Year Closing Entry as of ${closingDate}. Net Profit/Loss transferred to Retained Earnings.`,
      entries,
      userId: req.user?.id
    }, t);

    await t.commit();
    res.json({
      message: `Financial year successfully closed as of ${closingDate}. All income and expense ledgers zeroed out.`,
      netProfitLoss,
      voucherNumber: closeVoucher.voucherNumber,
      voucherId: closeVoucher.id
    });
  } catch (err) {
    if (t) await t.rollback();
    next(err);
  }
});

module.exports = router;
