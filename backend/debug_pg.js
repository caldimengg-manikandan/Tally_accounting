const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

async function debug() {
  try {
    const Item = require('./models/item.model')(sequelize, DataTypes);
    const Company = require('./models/company.model')(sequelize, DataTypes);
    
    // Explicit associations for this script
    Company.hasMany(Item, { foreignKey: 'CompanyId' });
    Item.belongsTo(Company, { foreignKey: 'CompanyId' });

    console.log('--- CLOUD POSTGRES DATA ---');
    
    const companies = await Company.findAll();
    console.log(`\nCOMPANIES FOUND: ${companies.length}`);
    companies.forEach(c => console.log(`${c.id}: ${c.name}`));

    const totalItems = await Item.count();
    console.log(`\nTOTAL ITEMS IN POSTGRES: ${totalItems}`);

    if (totalItems > 0) {
        const itemCounts = await Item.findAll({
            attributes: ['CompanyId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['CompanyId'],
            raw: true
        });
        itemCounts.forEach(r => {
            const co = companies.find(c => c.id === r.CompanyId);
            console.log(`${r.CompanyId} (${co ? co.name : 'Unknown'}): ${r.count} items`);
        });

        const firstItems = await Item.findAll({ limit: 5 });
        console.log('\nSAMPLE ITEMS:');
        firstItems.forEach(it => console.log(`- ${it.name} (HID: ${it.CompanyId})`));
    }

  } catch (err) {
    console.error('Postgres Debug Error:', err);
  } finally {
    await sequelize.close();
  }
}

debug();
