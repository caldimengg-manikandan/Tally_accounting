const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  logging: false,
});

async function checkUser() {
  try {
    const [users] = await sequelize.query('SELECT id, email, "activeCompanyId" FROM "Users"');
    console.log('USERS IN CLOUD:', users.length);
    users.forEach(u => console.log(` - ${u.email} (ID: ${u.id}, ActiveCo: ${u.activeCompanyId})`));
    
    for (const u of users) {
       const [cos] = await sequelize.query(`
         SELECT c.id, c.name 
         FROM "Companies" c
         JOIN "UserCompanies" uc ON c.id = uc."companyId"
         WHERE uc."userId" = '${u.id}'
       `);
       console.log(`   Companies for ${u.email}:`, cos.map(c => c.name).join(', '));
       
       for (const co of cos) {
          const [quotes] = await sequelize.query(`SELECT count(*) as count FROM "Quotes" WHERE "CompanyId" = '${co.id}'`);
          console.log(`     - ${co.name} has ${quotes[0].count} quotes`);
       }
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

checkUser();
