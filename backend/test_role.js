const { Company, User, UserCompany } = require('./models');

async function test() {
  const company = await Company.findOne({
    include: [{
      model: User,
      through: { model: UserCompany, attributes: ['role'] },
      attributes: ['id', 'name', 'email', 'role', 'activeCompanyId', 'createdAt']
    }]
  });
  
  if (!company) {
    console.log("No company found");
    return;
  }
  
  const users = company.Users.map(u => {
    const raw = u.get({ plain: true });
    console.log("u.UserCompany:", u.UserCompany?.role);
    console.log("raw.UserCompany:", raw.UserCompany?.role);
    raw.role = (raw.UserCompany && raw.UserCompany.role) || raw.role || 'VIEWER';
    return raw;
  });
  
  console.log("Mapped users:", JSON.stringify(users, null, 2));
}

test().catch(console.error).finally(() => process.exit(0));
