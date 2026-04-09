const { Ledger, Group } = require('./models');
const fs = require('fs');

async function debugLedgerJson() {
  try {
    const ledger = await Ledger.findOne({ 
      where: { name: 'sundry' },
      include: [{ model: Group, attributes: ['id', 'name', 'nature'] }] 
    });
    if (ledger) {
        fs.writeFileSync('ledger_json_debug.txt', JSON.stringify(ledger.toJSON(), null, 2));
    } else {
        fs.writeFileSync('ledger_json_debug.txt', 'Ledger NOT FOUND');
    }
  } catch (err) {
    fs.writeFileSync('ledger_json_debug.txt', err.stack);
  } finally {
    process.exit();
  }
}

debugLedgerJson();
