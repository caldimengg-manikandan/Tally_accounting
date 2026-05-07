const { sequelize } = require('./models');

async function check() {
  try {
    const [res] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'Vouchers';");
    console.log("COLUMNS IN VOUCHERS:");
    console.log(res.map(c => c.column_name).join(', '));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
