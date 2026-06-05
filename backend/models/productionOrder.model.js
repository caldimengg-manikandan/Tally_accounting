module.exports = (sequelize, DataTypes) => {
  const ProductionOrder = sequelize.define('ProductionOrder', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    CreatedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    ModifiedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    productionOrderNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quantity: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Completed'),
      defaultValue: 'Draft'
    }
  });

  return ProductionOrder;
};
