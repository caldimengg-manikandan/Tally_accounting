const { RecurringInvoice, RetainerInvoice, Company } = require('./models');
const fs = require('fs');

async function checkInvoices() {
  let output = '';
  try {
    const recCount = await RecurringInvoice.count();
    const retCount = await RetainerInvoice.count();
    output += `TOTAL RECURRING: ${recCount}\n`;
    output += `TOTAL RETAINER: ${retCount}\n`;
    
    const allRecs = await RecurringInvoice.findAll({ include: [Company] });
    allRecs.forEach(r => {
      output += `- Recurring: ${r.templateName}, Company: ${r.Company?.name}\n`;
    });

    const allRets = await RetainerInvoice.findAll({ include: [Company] });
    allRets.forEach(r => {
      output += `- Retainer: ${r.invoiceNumber}, Company: ${r.Company?.name}\n`;
    });

    fs.writeFileSync('invoice_check_results.txt', output);
  } catch (err) {
    fs.writeFileSync('invoice_check_results.txt', err.stack);
  } finally {
    process.exit();
  }
}

checkInvoices();
