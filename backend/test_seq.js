const { User } = require('./models');

async function testSeq() {
  try {
    const user = await User.findOne({ where: { email: 'lokeshwari5@gmail.com' } });
    console.log("Success:", user ? user.email : "Not found");
  } catch(e) {
    console.error("Sequelize Error:", e);
  }
}
testSeq().then(() => process.exit(0));
