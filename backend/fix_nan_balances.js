const { SalesInvoice } = require('./models');

async function fixNaNBalances() {
  try {
    const invoices = await SalesInvoice.findAll();
    console.log(`Found ${invoices.length} invoices.`);
    
    for (const inv of invoices) {
      if (isNaN(inv.balance) || inv.balance === null) {
        console.log(`Fixing balance for invoice ${inv.invoiceNumber}...`);
        const total = parseFloat(inv.totalAmount || 0);
        const paid = parseFloat(inv.amountPaid || 0);
        const newBalance = total - paid;
        await inv.update({ balance: newBalance });
        console.log(`Updated balance to ${newBalance}`);
      }
    }
    console.log('Finished fixing balances.');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing balances:', err);
    process.exit(1);
  }
}

fixNaNBalances();
