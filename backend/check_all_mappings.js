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

async function checkAll() {
  try {
    const [userCos] = await sequelize.query(`
      SELECT u.email, c.name as company_name, c.id as company_id, (SELECT count(*) FROM "Quotes" q WHERE q."CompanyId" = c.id) as quote_count
      FROM "Users" u
      JOIN "UserCompanies" uc ON u.id = uc."userId"
      JOIN "Companies" c ON c.id = uc."companyId"
    `);
    console.log('USER-COMPANY MAPPINGS:');
    userCos.forEach(row => {
      console.log(` - ${row.email} | ${row.company_name} (${row.company_id}) | Quotes: ${row.quote_count}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

checkAll();
