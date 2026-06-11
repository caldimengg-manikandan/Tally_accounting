module.exports = (sequelize, DataTypes) => {
  const FixedAsset = sequelize.define('FixedAsset', {
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
    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    purchaseValue: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    depreciationMethod: {
      type: DataTypes.ENUM('SLM', 'WDV'),
      defaultValue: 'WDV'
    },
    usefulLife: {
      type: DataTypes.INTEGER,
      defaultValue: 10
    },
    usefulLifeYears: {
      type: DataTypes.INTEGER,
      defaultValue: 10
    },
    scrapValue: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    currentBookValue: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    accumulatedDepreciation: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    depreciationRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 10.0
    }
  });

  return FixedAsset;
};

