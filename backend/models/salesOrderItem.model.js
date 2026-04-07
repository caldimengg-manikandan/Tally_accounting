module.exports = (sequelize, DataTypes) => {
  const SalesOrderItem = sequelize.define('SalesOrderItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    detail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    quantity: {
      type: DataTypes.DOUBLE,
      defaultValue: 1
    },
    rate: {
      type: DataTypes.DOUBLE,
      defaultValue: 0
    },
    amount: {
      type: DataTypes.DOUBLE,
      defaultValue: 0
    }
  });

  return SalesOrderItem;
};
