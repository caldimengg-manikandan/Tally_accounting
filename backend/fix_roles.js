const { UserCompany } = require('./models');

async function fixRoles() {
  try {
    await UserCompany.update({ role: 'ADMIN' }, { where: {} });
    console.log('Fixed UserCompany roles to ADMIN.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixRoles();
