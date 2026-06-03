const { User, Company, sequelize } = require('../models');

async function checkUser() {
  try {
    const user = await User.findOne({
      where: { email: 'thejathangavel5@gmail.com' }
    });
    if (!user) {
      console.log("No user found with email thejathangavel5@gmail.com");
      return;
    }
    console.log(`User ID: ${user.id}, Email: ${user.email}, activeCompanyId: ${user.activeCompanyId}`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await sequelize.close();
  }
}

checkUser();
