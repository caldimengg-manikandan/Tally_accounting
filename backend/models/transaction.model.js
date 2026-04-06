module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    debit: {
      type: DataTypes.DOUBLE, // SQLite preferred for decimals
      defaultValue: 0.00
    },
    credit: {
      type: DataTypes.DOUBLE,
      defaultValue: 0.00
    },
    gstRate: {
      type: DataTypes.DOUBLE,
      defaultValue: 0.00
    },
    gstAmount: {
      type: DataTypes.DOUBLE,
      defaultValue: 0.00
    },
    hsnCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    quantity: {
      type: DataTypes.DOUBLE,
      defaultValue: 0
    },
    rate: {
      type: DataTypes.DOUBLE,
      defaultValue: 0
    },
    unit: {
      type: DataTypes.STRING,
      defaultValue: 'Nos'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    paranoid: true
  });

  return Transaction;
};
