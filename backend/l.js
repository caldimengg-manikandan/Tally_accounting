const { Ledger, Group } = require('./models');
async function run() {
  const data = await Ledger.findAll({ include: [Group] });
  data.forEach(l => console.log(`${l.name} -> ${l.Group?.name}`));
  process.exit();
}
run();
