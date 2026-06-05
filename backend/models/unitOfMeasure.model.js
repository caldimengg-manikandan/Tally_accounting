module.exports = (sequelize, DataTypes) => {
  const UnitOfMeasure = sequelize.define('UnitOfMeasure', {
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
    symbol: {
      type: DataTypes.STRING,
      allowNull: false
    },
    formalName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    decimalPlaces: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  });

  return UnitOfMeasure;
};
