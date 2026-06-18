const axios = require('axios'); // not available
const http = require('http');

async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'thejathangavel5@gmail.com', password: 'password' })
    });
    // the password was wrong but it might still return companies for that user
    const data = await res.json();
    console.log('Login:', data.error || data);
    
    // Wait, let's just make the backend API calls directly using the routes or just look at the backend logs
  } catch (err) {
    console.log("Error:", err.message);
  }
}
test();
