module.exports = (sequelize, DataTypes) => {
  const Budget = sequelize.define('Budget', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fiscalYear: {
      type: DataTypes.STRING,
      allowNull: false
    },
    period: {
      type: DataTypes.ENUM('Monthly', 'Quarterly', 'Half-yearly', 'Yearly'),
      defaultValue: 'Monthly'
    }
  });

  return Budget;
};
