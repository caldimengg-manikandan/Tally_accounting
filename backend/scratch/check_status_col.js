const { sequelize } = require('../models');

async function check() {
  try {
    await sequelize.authenticate();
    const [res] = await sequelize.query("PRAGMA table_info('Vouchers')");
    const cols = res.map(c => c.name);
    console.log('Voucher columns:', cols.join(', '));
    console.log('Has status column:', cols.includes('status'));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
