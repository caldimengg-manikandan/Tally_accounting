module.exports = (sequelize, DataTypes) => {
  const PayrollSettings = sequelize.define('PayrollSettings', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    pfEmployeeRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 12.00,
      allowNull: false
    },
    esiEmployeeRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.75,
      allowNull: false
    },
    ptMonthlyAmount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 200.00,
      allowNull: false
    },
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  });

  PayrollSettings.associate = function(models) {
    PayrollSettings.belongsTo(models.Company);
    models.Company.hasOne(PayrollSettings);
  };

  return PayrollSettings;
};
