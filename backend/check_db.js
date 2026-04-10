const { Ledger, Group, Company, sequelize } = require('./models');

async function checkData() {
  try {
    // Ensure database is synced before checking
    await sequelize.sync({ alter: true });
    console.log("DB SYNCED.");

    const companies = await Company.findAll({ raw: true });
    console.log("COMPANIES FOUND:", companies.length);
    if (companies.length > 0) {
      const coId = companies[0].id;
      console.log("CHECKING FOR COMPANY:", coId);
      
      const groups = await Group.findAll({ where: { CompanyId: coId }, raw: true });
      console.log("GROUPS FOUND:", groups.length);
      groups.forEach(g => console.log(` - Group: ${g.name} (${g.id})`));
      
      const ledgers = await Ledger.findAll({ where: { CompanyId: coId, customerType: 'Business' }, raw: true });
      console.log("BUSINESS LEDGERS (Customers) FOUND:", ledgers.length);
      ledgers.forEach(l => console.log(` - Ledger: ${l.name} (Group: ${l.GroupId})`));
    } else {
      console.log("NO COMPANIES FOUND IN DB.");
    }
  } catch (err) {
    console.error("DB CHECK ERROR:", err);
  } finally {
    process.exit();
  }
}

checkData();
