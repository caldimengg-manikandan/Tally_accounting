const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testCompaniesHttp() {
  const userId = '7af19829-56f3-47e2-840a-686707b8a8b2';
  const companyId = '9c723abd-2d10-4caf-9c1e-dda33b479b48';

  const token = jwt.sign(
    { id: userId, role: 'ADMIN', companyId },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  try {
    const url = `http://localhost:5000/api/companies`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("HTTP Status:", res.status);
    const data = await res.json();
    console.log("Companies:", data);
  } catch (err) {
    console.error("HTTP Request failed:", err.message);
  }
}

testCompaniesHttp();
