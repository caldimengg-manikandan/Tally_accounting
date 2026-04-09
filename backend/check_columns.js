const { sequelize } = require('./models');
const fs = require('fs');

async function checkColumns() {
  try {
    const [results] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'Ledgers'");
    const columns = results.map(r => r.column_name);
    fs.writeFileSync('column_check.txt', `Ledgers Columns: ${columns.join(', ')}`);

    const [groups] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'Groups'");
    fs.appendFileSync('column_check.txt', `\nGroups Columns: ${groups.map(r => r.column_name).join(', ')}`);
  } catch (err) {
    fs.writeFileSync('column_check.txt', err.stack);
  } finally {
    process.exit();
  }
}

checkColumns();
