const axios = require('axios');

async function testCompanyGet() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'lokeshwari5@gmail.com',
      password: 'password123'
    });
    // This will fail because the password is not password123, but we can't login via script without correct password.
    console.log(res.data);
  } catch(e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
testCompanyGet();
