module.exports = (sequelize, DataTypes) => {
  const SalaryStructure = sequelize.define('SalaryStructure', {
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    gradeLevel: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    effectiveFrom: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    effectiveTo: {
      type: DataTypes.DATEONLY,
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
        name: 'salary_struct_code_unique',
        unique: true,
        fields: ['CompanyId', 'code'],
        where: { isActive: true }
      }
    ]
  });

  return SalaryStructure;
};
