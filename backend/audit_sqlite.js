const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

function query(sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function check() {
  try {
    console.log("SQLITE AUDIT:");
    const companies = await query('SELECT name FROM Companies');
    console.log("Companies:", companies.map(c => c.name).join(', '));
    
    const ledgers = await query('SELECT count(*) as count FROM Ledgers');
    console.log("Ledgers Count:", ledgers[0].count);

    const vouchers = await query('SELECT count(*) as count FROM Vouchers');
    console.log("Vouchers Count:", vouchers[0].count);

    db.close();
  } catch (err) {
    console.error(err);
    db.close();
  }
}

check();
