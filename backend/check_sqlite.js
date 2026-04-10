const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

async function checkSqlite() {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: false,
  });

  const Company = require('./models/company.model')(sequelize, DataTypes);
  const Ledger = require('./models/ledger.model')(sequelize, DataTypes);

  try {
    const companies = await Company.findAll({ raw: true });
    console.log("SQLITE COMPANIES FOUND:", companies.length);
    for (const co of companies) {
      console.log(` - Company: ${co.name} (${co.id})`);
      const ledgers = await Ledger.findAll({ where: { CompanyId: co.id }, raw: true });
      console.log(`   - Ledgers: ${ledgers.length}`);
    }
  } catch (err) {
    console.error("SQLITE CHECK ERROR:", err);
  } finally {
    await sequelize.close();
  }
}

checkSqlite();
