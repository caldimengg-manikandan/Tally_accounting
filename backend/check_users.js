const { User, UserCompany } = require('./models');

async function check() {
  // Find a user who is not a SUPER_ADMIN
  const users = await User.findAll({
    where: {
      role: ['VIEWER', 'ACCOUNTANT', 'MANAGER', 'EMPLOYEE', 'AUDITOR', 'ADMIN']
    },
    include: [UserCompany]
  });
  console.log(users.map(u => ({ email: u.email, role: u.role, activeCompanyId: u.activeCompanyId })));
}

check().catch(console.error).finally(() => process.exit(0));
