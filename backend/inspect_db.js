const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Inspecting Users table for null IDs...');

db.all('SELECT * FROM Users', [], (err, rows) => {
  if (err) {
    console.error('Error querying Users:', err.message);
    process.exit(1);
  }
  
  if (rows.length === 0) {
    console.log('Users table is empty.');
  } else {
    rows.forEach((row, index) => {
      console.log(`User ${index + 1}: ID=${row.id}, Email=${row.email}`);
    });
  }
  
  console.log('Inspecting UserCompanies for null IDs...');
  db.all('SELECT * FROM UserCompanies', [], (err, rows) => {
    if (err) {
      console.log('UserCompanies table not found or error:', err.message);
    } else {
      console.log(`UserCompanies has ${rows.length} rows.`);
    }
    db.close();
  });
});
