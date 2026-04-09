const { Ledger, Group, Company, User, RecurringInvoice, RetainerInvoice } = require('./models');
const fs = require('fs');

async function fullAudit() {
  let output = '--- FULL SYSTEM AUDIT ---\n\n';
  try {
    const companies = await Company.findAll({ order: [['name', 'ASC']] });
    output += `TOTAL COMPANIES: ${companies.length}\n`;
    for (const co of companies) {
      output += `\nCOMPANY: ${co.name} [ID: ${co.id}]\n`;
      
      const ledgers = await Ledger.findAll({ where: { CompanyId: co.id }, include: [Group] });
      output += `LEDGERS (${ledgers.length}):\n`;
      ledgers.forEach(l => {
        output += `  - [${l.id}] ${l.name} (Group: ${l.Group?.name || 'NULL'}, GroupId: ${l.GroupId})\n`;
      });

      const recurring = await RecurringInvoice.findAll({ where: { CompanyId: co.id } });
      output += `RECURRING INVOICES (${recurring.length}):\n`;
      recurring.forEach(r => {
        output += `  - ${r.templateName}\n`;
      });

      const retainer = await RetainerInvoice.findAll({ where: { CompanyId: co.id } });
      output += `RETAINER INVOICES (${retainer.length}):\n`;
      retainer.forEach(r => {
        output += `  - ${r.invoiceNumber}\n`;
      });
    }

    const users = await User.findAll();
    output += `\nUSERS (${users.length}):\n`;
    users.forEach(u => {
      output += `  - ${u.email} [ActiveCompanyId: ${u.activeCompanyId}]\n`;
    });

    fs.writeFileSync('full_audit_results.txt', output);
  } catch (err) {
    fs.writeFileSync('full_audit_results.txt', err.stack);
  } finally {
    process.exit();
  }
}

fullAudit();
