const axios = require('axios');

async function testLogin() {
  try {
    const res = await axios.post('http://127.0.0.1:5000/api/auth/login', {
      email: 'lokeshwar5@gmail.com',
      password: 'SomePassword1!'
    });
    console.log(res.data);
  } catch (err) {
    console.error('Error response:', err.response?.data);
  }
}

testLogin();
