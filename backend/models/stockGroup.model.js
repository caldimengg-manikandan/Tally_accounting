module.exports = (sequelize, DataTypes) => {
  const StockGroup = sequelize.define('StockGroup', {
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true
    }
  });

  return StockGroup;
};
