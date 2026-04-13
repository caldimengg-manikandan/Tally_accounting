const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

async function check() {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: false
  });

  try {
    const [results] = await sequelize.query("SELECT name FROM Ledgers;");
    console.log(`FOUND ${results.length} LEDGERS IN SQLITE:`);
    results.forEach(r => console.log(` - ${r.name}`));
    process.exit(0);
  } catch (err) {
    console.log("NO DATA IN SQLITE OR TABLE MISSING.");
    process.exit(0);
  }
}

check();
