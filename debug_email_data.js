const { Ledger, DeliveryChallan, Company } = require('./backend/models');

async function debug() {
  try {
    const challan = await DeliveryChallan.findOne({
      where: { challanNumber: 'DC-5740' },
      include: [{ model: Ledger, as: 'Customer' }]
    });

    if (challan) {
      console.log('CHALLAN FOUND:', challan.challanNumber);
      console.log('CUSTOMER:', challan.Customer?.name);
      console.log('CUSTOMER EMAIL:', challan.Customer?.email);
    } else {
      console.log('CHALLAN DC-5740 NOT FOUND');
    }

    const latestLedgers = await Ledger.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']]
    });
    console.log('LATEST LEDGERS:', latestLedgers.map(l => ({ name: l.name, email: l.email })));

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

debug();
