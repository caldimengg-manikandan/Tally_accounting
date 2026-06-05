module.exports = (sequelize, DataTypes) => {
  const BOM = sequelize.define('BOM', {
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
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quantity: {
      type: DataTypes.DECIMAL(15, 4),
      defaultValue: 1.0000
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  return BOM;
};
