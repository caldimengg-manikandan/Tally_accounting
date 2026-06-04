const { User, sequelize } = require('../models');

async function check() {
  try {
    await sequelize.authenticate();
    console.log('DB Connection OK');

    const users = await User.findAll();
    console.log('\n--- USERS ---');
    for (const u of users) {
      console.log(`User ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, ActiveCompanyId: ${u.activeCompanyId}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

check();
