const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\user\\Documents\\Tally_main_new\\Tally_accounting\\frontend\\src\\modules\\purchases\\PurchaseOrdersView.jsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('Occurrences of showPDFView:');
lines.forEach((line, idx) => {
  if (line.includes('showPDFView') || line.includes('Show PDF View')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
process.exit(0);
