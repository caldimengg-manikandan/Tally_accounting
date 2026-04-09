const { Ledger, Group, Company, User } = require('./models');
const fs = require('fs');

async function checkCompaniesAndLedgers() {
  let output = '--- LEDGER AUDIT ---\n\n';
  try {
    const companies = await Company.findAll({ order: [['name', 'ASC']] });
    output += `TOTAL COMPANIES: ${companies.length}\n`;
    for (const co of companies) {
      const ledgers = await Ledger.findAll({ where: { CompanyId: co.id }, include: [Group] });
      output += `- [${co.id}] ${co.name}: ${ledgers.length} ledgers\n`;
      ledgers.forEach(l => {
          output += `  * ${l.name} | Group: ${l.Group?.name || 'NULL'}\n`;
      });
    }

    const users = await User.findAll();
    output += `\nUSERS:\n`;
    users.forEach(u => {
      output += `  - ${u.email} [Active: ${u.activeCompanyId}]\n`;
    });

    fs.writeFileSync('ledger_audit_v2.txt', output);
  } catch (err) {
    fs.writeFileSync('ledger_audit_v2.txt', err.stack);
  } finally {
    process.exit();
  }
}

checkCompaniesAndLedgers();
