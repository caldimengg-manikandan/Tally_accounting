const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'backend', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('--- COMPANIES ---');
  db.each("SELECT id, name FROM Companies", (err, row) => {
    if (err) console.error(err);
    console.log(`${row.id}: ${row.name}`);
  });

  console.log('\n--- ITEMS COUNT PER COMPANY ---');
  db.each("SELECT companyId, COUNT(*) as count FROM Items GROUP BY companyId", (err, row) => {
    if (err) console.error(err);
    console.log(`${row.companyId}: ${row.count} items`);
  });

  console.log('\n--- FIRST 5 ITEMS ---');
  db.each("SELECT name, companyId FROM Items LIMIT 5", (err, row) => {
    if (err) console.error(err);
    console.log(`${row.name} (HID: ${row.companyId})`);
  });
});

db.close();
