const axios = require('axios');

async function test() {
  try {
    const api = axios.create({ baseURL: 'http://localhost:5000/api', withCredentials: true });
    
    // Login as the invited user (we need to know their email. Let's just create one)
    console.log("Registering temp admin to invite...");
    // Let's just skip creating and just query DB directly.
  } catch (err) {
    console.error(err);
  }
}
