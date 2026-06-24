const axios = require('axios');

async function test() {
  console.log("Sending request...");
  const start = Date.now();
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'lokeshwari5@gmail.com',
      password: 'password123'
    });
    console.log("Success:", res.status, "in", Date.now()-start, "ms");
  } catch(e) {
    console.log("Failed:", e.response ? e.response.status : e.message, "in", Date.now()-start, "ms");
  }
}
test();
