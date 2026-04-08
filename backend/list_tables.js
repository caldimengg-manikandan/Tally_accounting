const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Listing all tables in database...');

db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
  if (err) {
    console.error('Error listing tables:', err.message);
    process.exit(1);
  }
  
  rows.forEach((row) => {
    console.log(`Table: ${row.name}`);
  });
  db.close();
});
