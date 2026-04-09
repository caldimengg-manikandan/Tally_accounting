const { Ledger, Group, Company, User } = require('./models');
const fs = require('fs');

async function robustAudit() {
  let output = '--- ROBUST AUDIT ---\n\n';
  try {
    const companies = await Company.findAll();
    output += `COMPANIES: ${companies.length}\n`;
    for (const co of companies) {
      output += `\n[${co.id}] ${co.name}\n`;
      const ledgers = await Ledger.findAll({ where: { CompanyId: co.id } });
      output += `  Found ${ledgers.length} ledgers\n`;
      for (const l of ledgers) {
        const group = await Group.findByPk(l.GroupId);
        output += `  * Ledger: ${l.name} [ID: ${l.id}] Group: ${group ? group.name : 'NONE'} (Nature: ${group ? group.nature : 'N/A'})\n`;
      }
    }
    
    const users = await User.findAll();
    output += `\nUSERS:\n`;
    users.forEach(u => {
      output += `  - ${u.email} [Active: ${u.activeCompanyId}]\n`;
    });

    fs.writeFileSync('robust_audit.txt', output);
  } catch (err) {
    fs.writeFileSync('robust_audit.txt', err.stack);
  } finally {
    process.exit();
  }
}

robustAudit();
