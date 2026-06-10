module.exports = (sequelize, DataTypes) => {
  const CostCenterAllocation = sequelize.define('CostCenterAllocation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    amount: {
      type: DataTypes.DOUBLE,
      defaultValue: 0.00,
      allowNull: false
    },
    percentage: {
      type: DataTypes.DOUBLE,
      defaultValue: 0.00,
      allowNull: false
    },
    CreatedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    ModifiedBy: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    paranoid: true
  });

  return CostCenterAllocation;
};
