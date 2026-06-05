module.exports = (sequelize, DataTypes) => {
  const BudgetItem = sequelize.define('BudgetItem', {
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
    targetAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    GroupId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  });

  return BudgetItem;
};

