const { RefreshToken } = require('./models');

async function check() {
  try {
    const rawToken = 'test';
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({ token: rawToken, UserId: '78be82ce-bc11-4702-9bae-01bd26472e02', expiresAt, used: false });
    console.log("Success");
  } catch (err) {
    console.error("DB Error:", err.message);
  }
}
check().then(() => process.exit(0));
