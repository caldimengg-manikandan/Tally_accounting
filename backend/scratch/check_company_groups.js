const { Company, Group, User, sequelize } = require('../models');

async function checkDb() {
  try {
    const companies = await Company.findAll({
      order: [['createdAt', 'DESC']]
    });
    console.log("=== COMPANIES ===");
    for (const c of companies) {
      const gCount = await Group.count({ where: { CompanyId: c.id } });
      console.log(`Company ID: ${c.id}, Name: ${c.name}, userId: ${c.userId}, GroupCount: ${gCount}`);
    }

    const firstCompany = companies[0];
    if (firstCompany) {
      console.log(`\n=== GROUPS FOR ${firstCompany.name} (ID: ${firstCompany.id}) ===`);
      const groups = await Group.findAll({ where: { CompanyId: firstCompany.id }, limit: 10 });
      groups.forEach(g => {
        console.log(`  - Group ID: ${g.id}, Name: ${g.name}, nature: ${g.nature}, parent_id: ${g.parent_id}`);
      });
    }
  } catch (err) {
    console.error("Error checking DB:", err);
  } finally {
    await sequelize.close();
  }
}

checkDb();
