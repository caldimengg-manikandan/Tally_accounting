module.exports = (sequelize, DataTypes) => {
  const SalaryStructure = sequelize.define('SalaryStructure', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    EmployeeId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    annualCtc: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    monthlyBasic: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    monthlyFixedAllowance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    annualBasic: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    monthlyHra: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    annualHra: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    annualFixedAllowance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    }
  });

  return SalaryStructure;
};
