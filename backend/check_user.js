const { User, Company } = require('./models');

async function testLogin() {
  try {
    const user = await User.findOne({
      where: { email: 'lokeshwari5@gmail.com' },
      include: [{ model: Company, through: { attributes: [] } }]
    });
    console.log("User found:", !!user);
    if (user) {
      console.log("Companies:", user.Companies);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

testLogin().then(() => process.exit(0));
