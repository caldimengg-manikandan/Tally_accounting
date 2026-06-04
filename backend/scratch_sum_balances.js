const { sequelize, Group, Ledger, Transaction, Voucher } = require('./models');

async function main() {
  try {
    const companyId = '5f028981-8de4-4c19-9a90-54257dd87f70';
    
    // Fetch groups
    const groups = await Group.findAll({ where: { CompanyId: companyId }, raw: true });
    const groupMap = {};
    groups.forEach(g => {
      groupMap[g.id] = g;
    });

    const ledgers = await Ledger.findAll({
      where: { CompanyId: companyId },
      include: [Group],
      raw: true,
      nest: true
    });

    const txs = await Transaction.findAll({
      include: [
        {
          model: Voucher,
          where: { CompanyId: companyId }
        }
      ]
    });

    const ledgerTotals = {};
    ledgers.forEach(l => {
      ledgerTotals[l.id] = { debit: 0, credit: 0 };
    });

    txs.forEach(t => {
      if (ledgerTotals[t.LedgerId]) {
        ledgerTotals[t.LedgerId].debit += parseFloat(t.debit || 0);
        ledgerTotals[t.LedgerId].credit += parseFloat(t.credit || 0);
      }
    });

    let totalDr = 0;
    let totalCr = 0;

    ledgers.forEach(l => {
      const isDrNature = ['Assets', 'Expenses'].includes(l.Group?.nature);
      const opening = parseFloat(l.openingBalance || 0);
      const opType = (l.openingBalanceType || 'Dr').trim().toUpperCase();
      
      let opDr = 0;
      let opCr = 0;
      if (opType === 'DR') {
        opDr = opening;
      } else {
        opCr = opening;
      }

      const totals = ledgerTotals[l.id] || { debit: 0, credit: 0 };
      const dr = opDr + totals.debit;
      const cr = opCr + totals.credit;

      const closing = dr - cr;
      
      let drCol = 0;
      let crCol = 0;
      if (isDrNature) {
        if (closing >= 0) {
          drCol = closing;
        } else {
          crCol = Math.abs(closing);
        }
      } else {
        if (closing <= 0) {
          crCol = Math.abs(closing);
        } else {
          drCol = closing;
        }
      }

      if (drCol > 0 || crCol > 0) {
        console.log(`Ledger: ${l.name} | Dr Col: ${drCol} | Cr Col: ${crCol}`);
        totalDr += drCol;
        totalCr += crCol;
      }
    });

    console.log(`Total Dr Col: ${totalDr}`);
    console.log(`Total Cr Col: ${totalCr}`);
    console.log(`Difference (Imbalance): ${totalDr - totalCr}`);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
main();
