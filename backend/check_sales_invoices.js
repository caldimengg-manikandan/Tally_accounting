const { SalesInvoice, Company, Ledger } = require('./models');
const fs = require('fs');

async function checkSalesInvoices() {
  let output = '--- SALES INVOICE AUDIT ---\n\n';
  try {
    const invoices = await SalesInvoice.findAll({
      include: [
        { model: Company, attributes: ['name'] },
        { model: Ledger, as: 'CustomerLedger', attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    output += `Total Sales Invoices Found: ${invoices.length}\n\n`;

    for (const inv of invoices) {
      output += `ID: ${inv.id}\n`;
      output += `INV#: ${inv.invoiceNumber}\n`;
      output += `CUSTOMER: ${inv.CustomerLedger?.name || 'Unknown'}\n`;
      output += `COMPANY: ${inv.Company?.name}\n`;
      output += `TOTAL: ${inv.totalAmount}\n`;
      output += `PAID: ${inv.amountPaid}\n`;
      output += `BALANCE: ${inv.balance}\n`;
      output += `STATUS: ${inv.status}\n`;
      output += `-----------------------------------\n`;
    }

    console.log(output);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkSalesInvoices();
