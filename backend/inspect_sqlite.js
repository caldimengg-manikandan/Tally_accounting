const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false,
});

const Company = sequelize.define('Company', {
  id: { type: DataTypes.UUID, primaryKey: true },
  name: DataTypes.STRING
}, { tableName: 'Companies' });

const Quote = sequelize.define('Quote', {
  id: { type: DataTypes.UUID, primaryKey: true },
  subject: DataTypes.STRING,
  quoteNumber: DataTypes.STRING,
  status: DataTypes.STRING,
  CompanyId: DataTypes.UUID
}, { tableName: 'Quotes' });

async function check() {
  try {
    const companies = await Company.findAll({ raw: true });
    console.log('COMPANIES IN SQLITE:', companies.length);
    for (const co of companies) {
      const quotes = await Quote.findAll({ where: { CompanyId: co.id }, raw: true });
      console.log(` - ${co.name}: ${quotes.length} quotes`);
      quotes.forEach(q => console.log(`   * [${q.quoteNumber}] ${q.subject} (${q.status})`));
    }
  } catch (err) {
    console.error('Error reading SQLite:', err.message);
  } finally {
    process.exit();
  }
}

check();
