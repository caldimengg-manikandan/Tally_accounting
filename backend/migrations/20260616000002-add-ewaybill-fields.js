'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('DeliveryChallans', 'ewbNumber', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('DeliveryChallans', 'ewbDate', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('DeliveryChallans', 'ewbValidUntil', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // TCS Fields
    await queryInterface.addColumn('SalesInvoices', 'tcsRate', {
      type: Sequelize.DECIMAL(5, 2),
      defaultValue: 0
    });
    await queryInterface.addColumn('SalesInvoices', 'tcsAmount', {
      type: Sequelize.DECIMAL(20, 2),
      defaultValue: 0
    });
    await queryInterface.addColumn('Ledgers', 'tcsApplicable', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Ledgers', 'tcsApplicable');
    await queryInterface.removeColumn('SalesInvoices', 'tcsAmount');
    await queryInterface.removeColumn('SalesInvoices', 'tcsRate');

    await queryInterface.removeColumn('DeliveryChallans', 'ewbNumber');
    await queryInterface.removeColumn('DeliveryChallans', 'ewbDate');
    await queryInterface.removeColumn('DeliveryChallans', 'ewbValidUntil');
  }
};
