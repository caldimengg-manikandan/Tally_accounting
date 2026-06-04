const { sequelize } = require('../models');

async function query() {
  try {
    await sequelize.authenticate();
    console.log('DB Connection OK');

    const [companies] = await sequelize.query('SELECT * FROM "Companies"');
    console.log('\n--- RAW COMPANIES ---');
    console.log(JSON.stringify(companies, null, 2));

    const [userCompanies] = await sequelize.query('SELECT * FROM "UserCompanies"');
    console.log('\n--- RAW USER-COMPANY JUNC TABLE ---');
    console.log(JSON.stringify(userCompanies, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

query();
