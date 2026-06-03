const { User, Company, sequelize } = require('../models');

async function test() {
  try {
    await sequelize.authenticate();
    const assoc = User.associations.Companies;
    console.log('--- ASSOCIATION ---');
    console.log('associationType:', assoc.associationType);
    console.log('through:', assoc.through);
    console.log('through keys:', assoc.through ? Object.keys(assoc.through) : 'N/A');
    if (assoc.through) {
      console.log('through.model:', assoc.through.model);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

test();
