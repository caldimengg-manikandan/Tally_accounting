const { User, Company, sequelize } = require('../models');

async function check() {
  try {
    await sequelize.authenticate();
    const assoc = User.associations.Companies;
    console.log('Association key: Companies');
    console.log('Through model name:', assoc.through.model.name);
    console.log('Through model getTableName:', typeof assoc.through.model.getTableName);
    console.log('Through property keys:', Object.keys(assoc.through));
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

check();
