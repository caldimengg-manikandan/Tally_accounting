const { Ledger, Group, Transaction, Voucher, Company } = require('./models');

async function run() {
  try {
    const companies = await Company.findAll({ raw: true });
    console.log('COMPANIES IN DATABASE:');
    console.log(companies.map(c => ({ id: c.id, name: c.name })));

    // Let's assume we want to query for the active company or first company
    if (companies.length === 0) {
      console.log('No companies found.');
      return;
    }
    const companyId = companies[0].id;
    console.log(`\nUSING COMPANY ID: ${companyId} (${companies[0].name})`);

    const groups = await Group.findAll({ where: { CompanyId: companyId }, raw: true });
    console.log(`\nGROUPS count: ${groups.length}`);
    console.log(groups.map(g => ({ id: g.id, name: g.name, nature: g.nature, parentId: g.parent_id })));

    const ledgers = await Ledger.findAll({
      where: { CompanyId: companyId },
      include: [{ model: Group, attributes: ['name', 'nature'] }],
      raw: true,
      nest: true
    });
    console.log(`\nLEDGERS count: ${ledgers.length}`);
    console.log(ledgers.map(l => ({ id: l.id, name: l.name, group: l.Group.name, nature: l.Group.nature, open: l.openingBalance, openType: l.openingBalanceType })));

    const txs = await Transaction.findAll({
      include: [
        { model: Ledger, include: [{ model: Group }] },
        { model: Voucher }
      ],
      raw: true,
      nest: true
    });
    console.log(`\nTRANSACTIONS count: ${txs.length}`);
    txs.forEach(t => {
      console.log(`Tx ID: ${t.id} | Ledger: ${t.Ledger.name} (${t.Ledger.Group.name}, ${t.Ledger.Group.nature}) | Dr: ${t.debit} | Cr: ${t.credit} | Voucher: ${t.Voucher?.voucherType} #${t.Voucher?.voucherNumber}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

run();
