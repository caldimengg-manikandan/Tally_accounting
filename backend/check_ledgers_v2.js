const { Ledger, Group, Company } = require('./models');

async function checkLedgers() {
  try {
    const allLedgers = await Ledger.findAll({ include: [Group, Company] });
    console.log(`TOTAL LEDGERS IN DB: ${allLedgers.length}`);
    allLedgers.forEach(l => {
      console.log(`- ID: ${l.id}, Name: ${l.name}, Company: ${l.Company?.name}, Group: ${l.Group?.name}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkLedgers();
