module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableExists = await queryInterface.describeTable('Users').then(() => true).catch(() => false);
    if (!tableExists) {
      console.log('Fresh database detected. Baselining schema...');
      // Sync models to create tables
      const { sequelize } = require('../../backend/models');
      // Temporarily sync to baseline schema
      await sequelize.sync({ force: false });
    } else {
      console.log('Existing database detected. Skipping baseline schema creation.');
    }
  },
  down: async (queryInterface, Sequelize) => {
    // Drop tables if rolled back (normally not recommended for baseline migrations)
  }
};
