const { Ledger, Company } = require('./models');

async function check() {
  try {
    const ledgers = await Ledger.findAll({ paranoid: false });
    console.log(`TOTAL LEDGERS (Including Deleted): ${ledgers.length}`);
    for (const l of ledgers) {
      console.log(` - ${l.name} | Co: ${l.CompanyId} | DeletedAt: ${l.deletedAt}`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
