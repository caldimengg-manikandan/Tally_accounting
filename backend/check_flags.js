const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  logging: false
});

async function debug() {
  try {
    const Item = require('./models/item.model')(sequelize, DataTypes);
    const items = await Item.findAll({
      where: { CompanyId: '7d782f6b-d412-4fa4-8eb9-1079ec70ac10' },
      attributes: ['name', 'salesInformation', 'purchaseInformation']
    });
    console.log('--- ITEM FLAGS ---');
    items.forEach(it => {
      console.log(`- ${it.name}: Sales=${it.salesInformation}, Purchase=${it.purchaseInformation}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

debug();
