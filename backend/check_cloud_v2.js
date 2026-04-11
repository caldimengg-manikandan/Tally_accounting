const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  },
  logging: false,
});

async function checkCloud() {
  try {
    const [tables] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    console.log('TABLES:', tables.map(t => t.table_name));
    
    for (const t of tables) {
       const [count] = await sequelize.query(`SELECT count(*) as count FROM "${t.table_name}"`);
       console.log(` - ${t.table_name}: ${count[0].count}`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

checkCloud();
