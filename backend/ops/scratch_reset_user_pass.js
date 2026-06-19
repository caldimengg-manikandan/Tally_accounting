const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function run() {
  try {
    const user = await User.findOne({ where: { email: 'acchuashh025@gmail.com' } });
    if (!user) {
      console.log('User not found!');
      return;
    }
    const hashedPassword = await bcrypt.hash('Password@123', 10);
    await user.update({
      password: hashedPassword,
      oauthOnly: false,
      failedLoginAttempts: 0,
      lockedUntil: null
    });
    console.log('Successfully updated acchuashh025@gmail.com with Password@123 and oauthOnly: false');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
run();
