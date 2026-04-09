const { sequelize, AuditLog } = require('./models');

async function check() {
  try {
    await sequelize.authenticate();
    console.log('DB Connected');
    const count = await AuditLog.count();
    console.log('AuditLog count:', count);
    process.exit(0);
  } catch (err) {
    console.error('Check failed:', err);
    process.exit(1);
  }
}

check();
