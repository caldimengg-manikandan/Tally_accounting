module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    const options = { transaction };
    try {
      const tableDescription = await queryInterface.describeTable('Companies').catch(() => null);
      if (tableDescription && tableDescription.features) {
        console.log('Dropping deprecated column Companies.features...');
        await queryInterface.removeColumn('Companies', 'features', options);
      } else {
        console.log('Column Companies.features does not exist, skipping drop.');
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Failed to drop column Companies.features:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Optional rollback logic
  }
};
