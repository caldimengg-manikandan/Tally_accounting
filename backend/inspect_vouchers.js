const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Inspecting Vouchers Table:');

db.all('SELECT id, voucherType, voucherNumber, CompanyId, date FROM Vouchers', [], (err, rows) => {
  if (err) {
    console.error('Error querying Vouchers:', err.message);
    process.exit(1);
  }
  
  if (rows.length === 0) {
    console.log('Vouchers table is empty.');
  } else {
    console.log(`Found ${rows.length} vouchers:`);
    rows.forEach((row, index) => {
      console.log(`${index + 1}: [${row.voucherType}] #${row.voucherNumber} (CompanyId: ${row.CompanyId})`);
    });
  }
  
  db.close();
});
