const { User, Company, sequelize } = require('../models');

async function check() {
  try {
    await sequelize.authenticate();
    console.log('DB Connection OK');

    const user = await User.findOne({
      where: { email: 'swa@gmail.com' },
      include: [Company]
    });

    if (!user) {
      console.log('User swa@gmail.com not found!');
      return;
    }

    console.log(`User: ${user.email} (ID: ${user.id})`);
    console.log('Associated Companies:');
    if (user.Companies) {
      for (const c of user.Companies) {
        console.log(`  - Company ID: ${c.id}, Name: ${c.name}`);
      }
    } else {
      console.log('  None');
    }

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

check();
