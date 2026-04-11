const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  logging: false,
});

async function dump() {
  try {
    const [users] = await sequelize.query('SELECT id, email FROM "Users"');
    console.log('--- ALL USERS ---');
    for (const u of users) {
       const [cos] = await sequelize.query(`
         SELECT c.name, c.id 
         FROM "Companies" c
         JOIN "UserCompanies" uc ON c.id = uc."companyId"
         WHERE uc."userId" = '${u.id}'
       `);
       console.log(`User: ${u.email} (${u.id})`);
       cos.forEach(c => console.log(`   -> Company: ${c.name} (${c.id})`));
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

dump();
