const { sequelize, User } = require('../models');

async function checkUserData() {
  try {
    const user = await User.findOne({ where: { email: 'swathi@gmail.com' }, raw: true });
    if (!user) {
      console.log("User not found: swathi@gmail.com");
      return;
    }
    
    console.log(`User found: ${user.name}, OrgID: ${user.organizationId}`);

    const [companies] = await sequelize.query(`
      SELECT "id", "name" FROM "Companies" 
      WHERE "organizationId" = '${user.organizationId}'
    `);

    console.log("\n--- Companies for this user ---");
    for (const co of companies) {
      const [items] = await sequelize.query(`
        SELECT count(*) as count FROM "Items" 
        WHERE "CompanyId" = '${co.id}'
      `);
      console.log(`Company: ${co.name} (${co.id}) -> Items count: ${items[0].count}`);
    }

  } catch (err) {
    console.error("Diagnostic failed:", err);
  } finally {
    process.exit();
  }
}

checkUserData();
