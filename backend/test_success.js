const { User, Company } = require('./models');
const { login } = require('./modules/auth/auth.controller');

async function testIssueTokens() {
  try {
    const user = await User.findOne({
      where: { email: 'lokeshwari5@gmail.com' },
      include: [{ model: Company, through: { attributes: [] } }]
    });

    const req = {
      body: { email: 'lokeshwari5@gmail.com', password: 'password123' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' }
    };
    
    const res = {
      status: (code) => {
        console.log('STATUS:', code);
        return {
          json: (data) => console.log('JSON:', data)
        }
      },
      json: (data) => console.log('JSON DATA:', data),
      cookie: (name, val, opts) => console.log('COOKIE SET:', name),
      setHeader: (name, val) => console.log('HEADER SET:', name)
    };

    const bcrypt = require('bcryptjs');
    const originalCompare = bcrypt.compare;
    bcrypt.compare = async () => true;

    await login(req, res);

    bcrypt.compare = originalCompare;
  } catch (err) {
    console.error("Uncaught DB Error:", err);
  }
}

testIssueTokens().then(() => process.exit(0));
