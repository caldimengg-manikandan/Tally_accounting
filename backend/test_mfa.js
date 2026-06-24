const { MfaSecret } = require('./models');

async function test() {
  try {
    const record = await MfaSecret.findOne({ where: { userId: '78be82ce-bc11-4702-9bae-01bd26472e02', verified: true } });
    console.log(record);
  } catch(err) {
    console.error("DB Error:", err.message);
  }
  process.exit(0);
}
test();
