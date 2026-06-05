module.exports = (sequelize, DataTypes) => {
  const RecurringBillItem = sequelize.define('RecurringBillItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    CreatedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    ModifiedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    itemName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    qty: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 1
    },
    rate: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    account: {
      type: DataTypes.STRING
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    }
  });

  return RecurringBillItem;
};
