const { User, Company, sequelize } = require('../models');

async function debug() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const user = await User.findOne({ where: { email: 'swa@gmail.com' } });
    if (!user) {
      console.log('User swa@gmail.com not found.');
      return;
    }
    console.log(`User found: ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);

    const companies = await user.getCompanies({ raw: true });
    console.log('\n--- COMPANIES ASSOCIATED WITH swa@gmail.com ---');
    companies.forEach(c => {
      console.log(`Company ID: ${c.id} | Name: "${c.name}" | baseCurrency: ${c.baseCurrency}`);
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sequelize.close();
  }
}

debug();
