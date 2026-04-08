const { Ledger, Group, Company } = require('./models');

async function checkLedgersWithGroups() {
  try {
    const ledgers = await Ledger.findAll({ 
      include: [{ model: Group }],
      raw: true,
      nest: true
    });
    console.log(`TOTAL LEDGERS IN DB: ${ledgers.length}`);
    ledgers.forEach(l => {
      console.log(` - Ledger: ${l.name} | Group: ${l.Group?.name} | Co: ${l.CompanyId}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkLedgersWithGroups();
