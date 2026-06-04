const { User, Company, sequelize } = require('../models');

async function check() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const users = await User.findAll({ include: [Company] });
    console.log('\n--- ALL USERS AND THEIR ASSOCIATED COMPANIES ---');
    users.forEach(u => {
      console.log(`User: ${u.name} (${u.email}) | Role: ${u.role}`);
      if (u.Companies) {
        u.Companies.forEach(c => {
          console.log(`  -> Company: "${c.name}" | ID: ${c.id}`);
        });
      } else {
        console.log('  -> No companies associated.');
      }
    });

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

check();
