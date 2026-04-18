const { User, Company } = require('../models');

async function checkUser() {
  try {
    const user = await User.findOne({ where: { email: 'thejathangavel5@gmail.com' } });
    if (!user) {
      console.log('User not found');
      return;
    }
    console.log('User found:', user.id, user.role, 'Active Co:', user.activeCompanyId);
    
    // Check companies associated with this user
    const companies = await user.getCompanies();
    console.log('Companies available to user:', companies.map(c => ({ id: c.id, name: c.name })));
    
    if (user.activeCompanyId) {
      const activeCo = await Company.findByPk(user.activeCompanyId);
      console.log('Current Active Company:', activeCo?.name);
    }
  } catch (err) {
    console.error('Check failed:', err.message);
  } finally {
    const { sequelize } = require('../models');
    await sequelize.close();
  }
}

checkUser();
