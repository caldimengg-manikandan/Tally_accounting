const { User, Company, sequelize } = require('./models');

async function check() {
  try {
    const [results] = await sequelize.query('SELECT * FROM "UserCompanies"');
    console.log(`FOUND ${results.length} PERMISSIONS:`);
    for (const r of results) {
      const u = await User.findByPk(r.userId);
      const c = await Company.findByPk(r.companyId);
      console.log(` - User: ${u?.email} owns Company: ${c?.name}`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
