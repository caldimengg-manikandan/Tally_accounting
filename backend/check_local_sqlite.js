const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log("CHECKING SQLITE DATABASE...");
  
  db.each('SELECT name FROM sqlite_master WHERE type="table"', (err, table) => {
    if (err) return console.error(err);
    console.log("TABLE:", table.name);
  });

  db.all('SELECT name FROM Companies', (err, rows) => {
    if (err) return;
    console.log("SQLITE COMPANIES:", rows.length);
    rows.forEach(r => console.log(" - " + r.name));
  });

  db.all('SELECT name FROM Ledgers', (err, rows) => {
    if (err) return;
    console.log("SQLITE LEDGERS:", rows.length);
  });

  db.all('SELECT id FROM Vouchers', (err, rows) => {
    if (err) return;
    console.log("SQLITE VOUCHERS:", rows.length);
    db.close();
  });
});
