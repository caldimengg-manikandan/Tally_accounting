async function test() {
  try {
    // We need to login first to get the token
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'thejathangavel5@gmail.com', password: 'password' }) // Wait, previously the password was wrong. Does it matter? We need a valid user.
    });
    
    // Instead of login, let's just use the api locally. Or better, check the console output of backend.
  } catch (err) {
    console.log("Error:", err.message);
  }
}
test();
