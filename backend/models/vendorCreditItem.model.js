module.exports = (sequelize, DataTypes) => {
  const VendorCreditItem = sequelize.define('VendorCreditItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    description: DataTypes.TEXT,
    quantity: {
      type: DataTypes.DECIMAL(20, 3),
      defaultValue: 1
    },
    rate: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0
    },
    amount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0
    },
    itemId: DataTypes.UUID,
    accountId: DataTypes.UUID, // Link to Ledger (e.g., Purchase Returns or Expense Account)
    VendorCreditId: DataTypes.UUID
  });

  VendorCreditItem.associate = (models) => {
    VendorCreditItem.belongsTo(models.VendorCredit, { foreignKey: 'VendorCreditId' });
    VendorCreditItem.belongsTo(models.Item, { foreignKey: 'itemId' });
    VendorCreditItem.belongsTo(models.Ledger, { as: 'Account', foreignKey: 'accountId' });
  };

  return VendorCreditItem;
};
