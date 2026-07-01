const fs = require('fs');
const path = require('path');
const moment = require('moment');
const ReminderService = require('./services/ReminderService');

const mockInvoice = {
  invoiceNumber: 'INV-2026-085',
  dueDate: moment().toDate(),
  balance: 45000.00,
  Company: { name: 'Global Tech Solutions' },
  CustomerLedger: { name: 'Logesh' }
};

const templates = [
  {
    type: 'UPCOMING',
    message: `Dear ${mockInvoice.CustomerLedger.name},\n\nThis is a friendly reminder that Invoice ${mockInvoice.invoiceNumber} for ${mockInvoice.balance} is due on ${moment(mockInvoice.dueDate).format('YYYY-MM-DD')}.`,
    filename: '../email_preview_upcoming.html'
  },
  {
    type: 'OVERDUE',
    message: `Dear ${mockInvoice.CustomerLedger.name},\n\nYour Invoice ${mockInvoice.invoiceNumber} for ${mockInvoice.balance} was due yesterday. Please arrange for payment at your earliest convenience.`,
    filename: '../email_preview_overdue.html'
  },
  {
    type: 'FINAL',
    message: `Dear ${mockInvoice.CustomerLedger.name},\n\nYour Invoice ${mockInvoice.invoiceNumber} for ${mockInvoice.balance} is 7 days overdue. Please submit payment immediately.`,
    filename: '../email_preview_final.html'
  }
];

templates.forEach(t => {
  const html = ReminderService.generateEmailTemplate(mockInvoice, t.type, t.message);
  const outPath = path.join(__dirname, t.filename);
  fs.writeFileSync(outPath, html);
  console.log(`Generated preview: ${outPath}`);
});
