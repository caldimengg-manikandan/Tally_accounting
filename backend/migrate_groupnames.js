const { Ledger, Group } = require('./models');

async function fix() {
  try {
    const ledgers = await Ledger.findAll({ include: [Group] });
    console.log(`Processing ${ledgers.length} ledgers...`);
    for (const l of ledgers) {
      if (l.Group && !l.groupName) {
        l.groupName = l.Group.name;
        await l.save();
        console.log(` - Updated ${l.name} with groupName: ${l.groupName}`);
      }
    }
    console.log("✅ Data Migration Completed.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
