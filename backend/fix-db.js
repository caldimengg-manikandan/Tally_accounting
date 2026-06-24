const { sequelize } = require('./models');
const { DataTypes } = require('sequelize');

async function fixDb() {
  try {
    await sequelize.authenticate();
    const queryInterface = sequelize.getQueryInterface();
    
    try {
      await queryInterface.addColumn('PayrollSettings', 'pfCap', { 
        type: DataTypes.DECIMAL(10, 2), 
        defaultValue: 1800.00, 
        allowNull: false 
      });
      console.log('Added pfCap');
    } catch(e) {
      console.log('Failed pfCap:', e.message);
    }
    
    try {
      await queryInterface.addColumn('PayrollSettings', 'esiThreshold', { 
        type: DataTypes.DECIMAL(10, 2), 
        defaultValue: 21000.00, 
        allowNull: false 
      });
      console.log('Added esiThreshold');
    } catch(e) {
      console.log('Failed esiThreshold:', e.message);
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

fixDb();
