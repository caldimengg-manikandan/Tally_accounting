const jwt = require('jsonwebtoken');
const https = require('https');

async function test() {
  const secret = 'tally_replica_secret_key_123';
  const token = jwt.sign(
    {
      id: '58a7eb18-75f4-466a-b681-5b2fe1e3f558',
      role: 'ADMIN',
      companyId: 'eb78e8e7-232d-43a5-be7f-3ea394c946bc'
    },
    secret,
    { expiresIn: '1d' }
  );

  console.log('Generated JWT Token.');

  const options = {
    hostname: 'tally-backend-wfml.onrender.com',
    path: '/api/ledgers/eb78e8e7-232d-43a5-be7f-3ea394c946bc',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Response Status: ${res.statusCode}`);
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log(`Response ledgers count: ${parsed.length}`);
        console.log('Vendors in response:');
        const vendors = parsed.filter(l => 
          l.name.toLowerCase().includes('ravi') || 
          l.groupName?.toLowerCase().includes('creditor') || 
          l.Group?.name?.toLowerCase().includes('creditor')
        );
        console.log(JSON.stringify(vendors, null, 2));
      } catch (err) {
        console.log('Raw Response Data:');
        console.log(data);
      }
    });
  });

  req.on('error', (err) => {
    console.error('API Request Failed:', err.message);
  });

  req.end();
}

test();
