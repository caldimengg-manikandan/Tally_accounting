const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false,
});

async function checkCloud() {
  try {
    const [companies] = await sequelize.query('SELECT count(*) as count FROM "Companies"');
    console.log('COMPANIES IN CLOUD:', companies[0].count);
    
    // Check if Quotes table exists
    const [tables] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    console.log('TABLES IN CLOUD:', tables.map(t => t.table_name).join(', '));
    
    if (tables.some(t => t.table_name === 'Quotes')) {
       const [quotes] = await sequelize.query('SELECT count(*) as count FROM "Quotes"');
       console.log('QUOTES IN CLOUD:', quotes[0].count);
    } else {
       console.log('Quotes table MISSING in cloud!');
    }
  } catch (err) {
    console.error('Error reading Cloud Postgres:', err.message);
  } finally {
    process.exit();
  }
}

checkCloud();
