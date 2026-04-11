module.exports = (sequelize, DataTypes) => {
  const DeliveryChallanItem = sequelize.define('DeliveryChallanItem', {
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
    DeliveryChallanId: DataTypes.UUID
  });

  DeliveryChallanItem.associate = (models) => {
    DeliveryChallanItem.belongsTo(models.DeliveryChallan);
    DeliveryChallanItem.belongsTo(models.Item, { foreignKey: 'itemId' });
  };

  return DeliveryChallanItem;
};
