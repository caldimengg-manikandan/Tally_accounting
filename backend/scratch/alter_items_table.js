const { sequelize, Sequelize } = require('../models');

async function runAlter() {
  const queryInterface = sequelize.getQueryInterface();
  try {
    console.log('Authenticating database connection...');
    await sequelize.authenticate();
    console.log('Database connected.');

    // Describe the table to check if columns already exist
    const tableInfo = await queryInterface.describeTable('Items');

    if (!tableInfo.hsnCode) {
      console.log('Adding hsnCode column...');
      await queryInterface.addColumn('Items', 'hsnCode', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'HSN/SAC code for GST'
      });
      console.log('hsnCode column added successfully.');
    } else {
      console.log('hsnCode column already exists.');
    }

    if (!tableInfo.itemCode) {
      console.log('Adding itemCode column...');
      await queryInterface.addColumn('Items', 'itemCode', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'SKU or item code'
      });
      console.log('itemCode column added successfully.');
    } else {
      console.log('itemCode column already exists.');
    }

    console.log('Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runAlter();
