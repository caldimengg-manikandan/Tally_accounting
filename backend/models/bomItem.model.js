module.exports = (sequelize, DataTypes) => {
  const BOMItem = sequelize.define('BOMItem', {
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
    quantity: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false
    }
  });

  return BOMItem;
};
