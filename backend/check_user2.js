const { User } = require('./models');
User.findOne({ where: { email: 'lokeshwari5@gmail.com' } }).then(u => {
  console.log('failedLoginAttempts:', u.failedLoginAttempts);
  console.log('oauthOnly:', u.oauthOnly);
  process.exit(0);
});
