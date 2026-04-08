const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Inspecting Items table schema...');
db.all('PRAGMA table_info(Items)', [], (err, rows) => {
  if (err) console.error(err);
  rows.forEach(r => console.log(`Column: ${r.name}, Type: ${r.type}`));

  console.log('\nInspecting AuditLogs table schema...');
  db.all('PRAGMA table_info(AuditLogs)', [], (err, rows) => {
    if (err) console.error(err);
    rows.forEach(r => console.log(`Column: ${r.name}, Type: ${r.type}`));

    console.log('\nSample AuditLogs:');
    db.all('SELECT * FROM AuditLogs LIMIT 5', [], (err, logs) => {
      if (err) console.error(err);
      console.log(logs);
      db.close();
    });
  });
});
