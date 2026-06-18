const { User } = require('./models');

async function checkUser() {
  console.log('Checking users...');
  try {
    const users = await User.findAll({ attributes: ['id', 'email', 'role', 'name'] });
    users.forEach(u => {
      console.log(`- ${u.name} | ${u.email} | Role: ${u.role}`);
    });
  } catch (err) {
    console.error('Error:', err);
  }
}

checkUser();
