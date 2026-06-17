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
    pfEmployerRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 12.00,
      allowNull: false
    },
    pfApplicable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    esiEmployeeRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.75,
      allowNull: false
    },
    esiEmployerRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 3.25,
      allowNull: false
    },
    esiApplicable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    ptMonthlyAmount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 200.00,
      allowNull: false
    },
    standardDeduction: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 50000.00,
      allowNull: false
    },
    incomeTaxSlabs: {
      type: DataTypes.JSONB,
      defaultValue: [
        { min: 0, max: 250000, rate: 0 },
        { min: 250000, max: 500000, rate: 5 },
        { min: 500000, max: 1000000, rate: 20 },
        { min: 1000000, max: null, rate: 30 }
      ]
    },
    pfRegistrationNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    esiRegistrationNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tanNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    payrollFrequency: {
      type: DataTypes.STRING,
      defaultValue: 'Monthly',
      allowNull: false
    },
    allowanceExemptions: {
      type: DataTypes.JSONB,
      defaultValue: {
        hraExemption: true,
        ltaExemption: false
      }
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
