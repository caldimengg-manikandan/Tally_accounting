'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Ledgers');
    
    if (!tableInfo.tdsApplicable) {
      await queryInterface.addColumn('Ledgers', 'tdsApplicable', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      });
    }

    if (!tableInfo.tcsApplicable) {
      await queryInterface.addColumn('Ledgers', 'tcsApplicable', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Ledgers', 'tdsApplicable');
    await queryInterface.removeColumn('Ledgers', 'tcsApplicable');
  }
};
