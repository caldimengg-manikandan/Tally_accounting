const { RecurringInvoice, RetainerInvoice, Company } = require('./models');
const fs = require('fs');

async function checkInvoices() {
  let output = '--- INVOICE AUDIT ---\n\n';
  try {
    const companies = await Company.findAll({ order: [['name', 'ASC']] });
    for (const co of companies) {
      output += `\nCOMPANY: ${co.name} [${co.id}]\n`;
      
      try {
        const recs = await RecurringInvoice.findAll({ where: { CompanyId: co.id } });
        output += `  RECURRING (${recs.length})\n`;
      } catch (e) { output += `  RECURRING ERROR: ${e.message}\n`; }

      try {
        const rets = await RetainerInvoice.findAll({ where: { CompanyId: co.id } });
        output += `  RETAINER (${rets.length})\n`;
      } catch (e) { output += `  RETAINER ERROR: ${e.message}\n`; }
    }
    fs.writeFileSync('invoice_audit_final.txt', output);
  } catch (err) {
    fs.writeFileSync('invoice_audit_final.txt', err.stack);
  } finally {
    process.exit();
  }
}

checkInvoices();
