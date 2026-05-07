const path = require('path');
const modelsPath = path.join(process.cwd(), 'backend', 'models');
const { User } = require(modelsPath);

async function checkUsers() {
  try {
    const users = await User.findAll({ attributes: ['id', 'name', 'email'] });
    console.log('Users:', JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUsers();
