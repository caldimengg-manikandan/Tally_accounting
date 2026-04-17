const { sequelize } = require('./models');

async function migrate() {
  const queryInterface = sequelize.getQueryInterface();
  const table = 'Ledgers';
  
  const columns = [
    { name: 'accountNumber', type: 'STRING' },
    { name: 'bankName', type: 'STRING' },
    { name: 'ifsc', type: 'STRING' },
    { name: 'accountCode', type: 'STRING' }
  ];

  for (const col of columns) {
    try {
      console.log(`Adding column ${col.name}...`);
      await queryInterface.addColumn(table, col.name, {
        type: col.type === 'STRING' ? require('sequelize').DataTypes.STRING : col.type,
        allowNull: true
      });
      console.log(`✅ ${col.name} added.`);
    } catch (err) {
      console.log(`⚠️  Could not add ${col.name} (maybe already exists):`, err.message);
    }
  }
  process.exit();
}

migrate();
