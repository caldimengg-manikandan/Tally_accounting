module.exports = (sequelize, DataTypes) => {
  const Payslip = sequelize.define('Payslip', {
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
    month: {
      type: DataTypes.STRING,
      allowNull: false
    },
    year: {
      type: DataTypes.INTEGER,
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
    pf: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    esi: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    profTax: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    netSalary: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Processed', 'Paid'),
      defaultValue: 'Draft'
    }
  });

  return Payslip;
};
