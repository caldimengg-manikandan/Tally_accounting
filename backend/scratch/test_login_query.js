const { User, Company, sequelize } = require('../models');

async function test() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const email = 'swa@gmail.com';
    const user = await User.findOne({ 
      where: { email },
      include: [{ model: Company, through: { attributes: [] } }]
    });

    console.log('User found:', user ? user.name : 'null');

  } catch (err) {
    console.error('Query failed:', err);
  } finally {
    await sequelize.close();
  }
}

test();
