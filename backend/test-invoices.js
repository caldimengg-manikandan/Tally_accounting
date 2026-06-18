const { SalesInvoice, Ledger, SalesInvoiceItem } = require('./models');

async function test() {
  try {
    const invoices = await SalesInvoice.findAll({
      where: { CompanyId: '9e2261ae-dd0a-47f9-b14d-5c6fb9dfb505' },
      include: [
        { model: Ledger, as: 'CustomerLedger', attributes: ['name', 'currency'] },
        { model: SalesInvoiceItem, as: 'items' }
      ]
    });
    console.log('Invoices found:', invoices.length);
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}
test();
