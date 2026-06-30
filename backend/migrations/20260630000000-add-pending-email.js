'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the column already exists to prevent migration failure if the scratch script was already run
    const tableInfo = await queryInterface.describeTable('Users');
    if (!tableInfo.pendingEmail) {
      await queryInterface.addColumn('Users', 'pendingEmail', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Users');
    if (tableInfo.pendingEmail) {
      await queryInterface.removeColumn('Users', 'pendingEmail');
    }
  }
};
