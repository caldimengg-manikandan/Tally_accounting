require('dotenv').config();
const { Sequelize } = require('sequelize');

const seq = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

(async () => {
  try {
    await seq.authenticate();
    const [users] = await seq.query('SELECT id, email FROM "Users"');
    console.log('Users in DB:');
    users.forEach(u => console.log(' - Email:', u.email));
    await seq.close();
  } catch (e) {
    console.error('❌ DB Error:', e.message);
    process.exit(1);
  }
})();
