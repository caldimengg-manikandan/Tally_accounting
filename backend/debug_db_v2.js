const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require('util');

const dbPath = path.join(__dirname, '..', 'backend', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const dbAll = promisify(db.all).bind(db);

async function debug() {
  try {
    console.log('--- COMPANIES ---');
    const companies = await dbAll("SELECT id, name FROM Companies");
    companies.forEach(c => console.log(`${c.id}: ${c.name}`));

    console.log('\n--- ITEMS COUNT PER COMPANY ---');
    const counts = await dbAll("SELECT companyId, COUNT(*) as count FROM Items GROUP BY companyId");
    counts.forEach(r => {
        const co = companies.find(c => c.id === r.companyId);
        console.log(`${r.companyId} (${co ? co.name : 'UNKNOWN'}): ${r.count} items`);
    });

    console.log('\n--- FIRST 10 ITEMS ---');
    const items = await dbAll("SELECT name, companyId FROM Items LIMIT 10");
    items.forEach(it => console.log(`- ${it.name} (HID: ${it.companyId})`));

  } catch (err) {
    console.error(err);
  } finally {
    db.close();
  }
}

debug();
