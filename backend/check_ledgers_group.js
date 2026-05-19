require('dotenv').config();
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL, { dialect: 'postgres', logging: false });
sequelize.query('SELECT name, "groupName" FROM "Ledgers" LIMIT 10;')
  .then(res => console.log(res[0]))
  .catch(console.error)
  .finally(() => process.exit());
