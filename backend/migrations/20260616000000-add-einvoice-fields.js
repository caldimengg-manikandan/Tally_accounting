'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('SalesInvoices', 'irnNumber', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('SalesInvoices', 'irnAckDate', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('SalesInvoices', 'irnQrCode', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('SalesInvoices', 'einvoiceStatus', {
      type: Sequelize.ENUM('PENDING', 'GENERATED', 'CANCELLED'),
      defaultValue: 'PENDING'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('SalesInvoices', 'irnNumber');
    await queryInterface.removeColumn('SalesInvoices', 'irnAckDate');
    await queryInterface.removeColumn('SalesInvoices', 'irnQrCode');
    await queryInterface.removeColumn('SalesInvoices', 'einvoiceStatus');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_SalesInvoices_einvoiceStatus";');
  }
};
