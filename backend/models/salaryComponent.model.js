module.exports = (sequelize, DataTypes) => {
  const SalaryComponent = sequelize.define('SalaryComponent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Companies', key: 'id' }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('Earning', 'Deduction', 'Statutory'),
      allowNull: false
    },
    componentNature: {
      type: DataTypes.ENUM('Fixed', 'Variable'),
      defaultValue: 'Fixed',
      allowNull: false
    },
    calculationType: {
      type: DataTypes.ENUM('Fixed', 'Percentage', 'Formula'),
      allowNull: false
    },
    calculationBase: {
      type: DataTypes.STRING,
      allowNull: true // Only needed if type is Percentage
    },
    calculationValue: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false
    },
    isStatutory: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isTaxable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    CreatedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    UpdatedBy: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    indexes: [
      {
        name: 'salary_comp_code_unique',
        unique: true,
        fields: ['CompanyId', 'code'],
        where: { isActive: true } // allow creating a new active one if old is soft-deleted
      }
    ]
  });

  return SalaryComponent;
};
