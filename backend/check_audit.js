const { AuditLog } = require('./models');
AuditLog.findAll({
  order: [['createdAt', 'DESC']],
  limit: 5
}).then(logs => {
  logs.forEach(l => console.log(l.action, l.detail, l.email, l.newData));
  process.exit(0);
});
