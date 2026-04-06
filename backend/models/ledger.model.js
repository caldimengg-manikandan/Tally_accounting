module.exports = (sequelize, DataTypes) => {
  const Ledger = sequelize.define('Ledger', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    openingBalance: {
      type: DataTypes.DOUBLE,
      defaultValue: 0.00
    },
    openingBalanceType: {
      type: DataTypes.ENUM('Dr', 'Cr'),
      defaultValue: 'Dr'
    },
    currentBalance: {
      type: DataTypes.DOUBLE,
      defaultValue: 0.00
    },
    // Customer/Vendor Specific Fields
    gstNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Maharashtra'
    },
    registrationType: {
      type: DataTypes.ENUM('Registered', 'Unregistered', 'Consumer', 'Overseas'),
      defaultValue: 'Registered'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    creditLimit: {
      type: DataTypes.DOUBLE,
      defaultValue: 0.00
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    paranoid: true
  });

  return Ledger;
};
