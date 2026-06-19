'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TdsEntries', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      tdsSection: {
        type: Sequelize.STRING,
        allowNull: false
      },
      grossAmount: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false
      },
      tdsRate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      tdsAmount: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false
      },
      pan: {
        type: Sequelize.STRING,
        allowNull: true
      },
      quarter: {
        type: Sequelize.STRING,
        allowNull: true
      },
      CompanyId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      vendorId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Ledgers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      paymentVoucherId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Vouchers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes for reporting
    await queryInterface.addIndex('TdsEntries', ['CompanyId', 'quarter']);
    await queryInterface.addIndex('TdsEntries', ['CompanyId', 'vendorId']);

    await queryInterface.addColumn('Ledgers', 'tdsApplicable', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Ledgers', 'tdsApplicable');
    await queryInterface.dropTable('TdsEntries');
  }
};
