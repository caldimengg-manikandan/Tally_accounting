const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false,
});

async function listTables() {
  try {
    const [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table';");
    console.log('TABLES:', results.map(r => r.name).join(', '));
    
    for (const table of results) {
       const [count] = await sequelize.query(`SELECT count(*) as count FROM \`${table.name}\``);
       console.log(` - ${table.name}: ${count[0].count} rows`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

listTables();
