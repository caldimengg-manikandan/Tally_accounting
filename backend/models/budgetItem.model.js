module.exports = (sequelize, DataTypes) => {
  const BudgetItem = sequelize.define('BudgetItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    targetAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    }
  });

  return BudgetItem;
};
