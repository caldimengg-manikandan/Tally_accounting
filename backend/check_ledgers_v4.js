const { Ledger, Group, Company } = require('./models');
const fs = require('fs');

async function checkLedgers() {
  let output = '';
  try {
    const allCompanies = await Company.findAll();
    output += `TOTAL COMPANIES: ${allCompanies.length}\n`;
    for (const co of allCompanies) {
        const count = await Ledger.count({ where: { CompanyId: co.id } });
        output += `- ${co.name} (${co.id}): ${count} ledgers\n`;
        if (count > 0) {
            const ledgers = await Ledger.findAll({ where: { CompanyId: co.id }, include: [Group] });
            ledgers.forEach(l => {
                output += `  * [${l.id}] ${l.name} | Group: ${l.Group?.name}\n`;
            });
        }
    }
    fs.writeFileSync('ledger_check_results.txt', output);
  } catch (err) {
    fs.writeFileSync('ledger_check_results.txt', err.stack);
  } finally {
    process.exit();
  }
}

checkLedgers();
