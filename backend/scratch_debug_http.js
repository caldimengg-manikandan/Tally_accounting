const jwt = require('jsonwebtoken');
const { User, sequelize } = require('./models');
const http = require('http');

async function debugRequest() {
  try {
    await sequelize.authenticate();
    
    // Find lokeshwari
    const user = await User.findOne({ where: { email: 'lokeshwari@gmail.com' } });
    if (!user) {
      console.log('User lokeshwari@gmail.com not found!');
      return;
    }

    const companyId = '9e2261ae-dd0a-47f9-b14d-5c6fb9dfb505'; // Reliance
    
    // Sign JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role, companyId },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log(`Generated Token: ${token}`);
    console.log(`Sending GET request to http://localhost:5000/api/fixed-assets/${companyId}`);

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/fixed-assets/${companyId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-company-id': companyId,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      console.log(`STATUS CODE: ${res.statusCode}`);
      console.log('HEADERS:', JSON.stringify(res.headers, null, 2));

      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        console.log('RESPONSE BODY:', body);
      });
    });

    req.on('error', (e) => {
      console.error(`Request error: ${e.message}`);
    });

    req.end();

  } catch (err) {
    console.error('Error:', err);
  }
}

debugRequest();
