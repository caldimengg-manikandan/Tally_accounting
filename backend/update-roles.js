const { User } = require('./models');
(async () => {
  try {
    await User.update({ role: 'SUPER_ADMIN' }, { where: {} });
    console.log("All users updated to SUPER_ADMIN");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
