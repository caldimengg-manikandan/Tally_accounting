const { AuditLog } = require('./backend/models');
AuditLog.findAll({ limit: 5, order: [['createdAt', 'DESC']] }).then(logs => {
  console.log(JSON.stringify(logs, null, 2));
}).catch(e => console.error(e));
