const { User } = require('./models');

async function check() {
  try {
    const user = await User.findOne({ where: { email: 'lokeshwari5@gmail.com' } });
    console.log("Success:", !!user);
  } catch (err) {
    console.error("DB Error:", err.message);
  }
}
check().then(() => process.exit(0));
