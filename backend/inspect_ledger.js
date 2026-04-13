const { Ledger, Group } = require('./models');

async function check() {
  try {
    const l = await Ledger.findOne({ 
      where: { name: 'debit pvt ltd' },
      include: [{ model: Group }]
    });
    if (l) {
      console.log("FOUND LEDGER:");
      console.log(JSON.stringify(l, null, 2));
    } else {
      console.log("NOT FOUND LEDGER 'debit pvt ltd'");
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
