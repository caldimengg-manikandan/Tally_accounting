module.exports = (sequelize, DataTypes) => {
  const SalaryStructureComponent = sequelize.define('SalaryStructureComponent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    SalaryStructureId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'SalaryStructures', key: 'id' }
    },
    SalaryComponentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'SalaryComponents', key: 'id' }
    },
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Companies', key: 'id' }
    },
    overrideCalculationType: {
      type: DataTypes.ENUM('Fixed', 'Percentage', 'Formula'),
      allowNull: true
    },
    overrideCalculationValue: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: true
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    indexes: [
      {
        name: 'salary_struct_comp_unique',
        unique: true,
        fields: ['SalaryStructureId', 'SalaryComponentId'],
        where: { isActive: true }
      }
    ]
  });

  return SalaryStructureComponent;
};
