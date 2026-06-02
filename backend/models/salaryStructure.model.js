module.exports = (sequelize, DataTypes) => {
  const SalaryStructure = sequelize.define('SalaryStructure', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    basic: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    hra: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    da: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    incentives: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    pfDeduction: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    esiDeduction: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    profTaxDeduction: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    }
  });

  return SalaryStructure;
};
