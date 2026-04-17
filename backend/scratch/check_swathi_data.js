const { User, Company, Item } = require('../models');

async function checkUserContext() {
  try {
    const user = await User.findOne({ where: { email: 'swathi@gmail.com' }, raw: true });
    if (!user) {
      console.log('User swathi@gmail.com not found.');
      return;
    }
    
    console.log(`--- USER FOUND: ${user.name} (${user.id}) ---`);
    console.log(`OrganizationID: ${user.organizationId}`);

    const companies = await Company.findAll({ 
      where: { organizationId: user.organizationId || null },
      raw: true 
    });

    if (companies.length === 0) {
      console.log('No companies found linked to this user/org.');
    } else {
      for (const co of companies) {
        console.log(`Checking Company: ${co.name} (${co.id})...`);
        const itemIds = await Item.findAll({ where: { CompanyId: co.id }, raw: true });
        console.log(` -> Found ${itemIds.length} items.`);
        if (itemIds.length > 0) {
          itemIds.forEach(it => console.log(`   - [${it.id}] ${it.name}`));
        }
      }
    }

  } catch (err) {
    console.error('Error in checkUserContext:', err);
  } finally {
    process.exit();
  }
}

checkUserContext();
