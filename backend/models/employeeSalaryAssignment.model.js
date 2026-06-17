module.exports = (sequelize, DataTypes) => {
  const EmployeeSalaryAssignment = sequelize.define('EmployeeSalaryAssignment', {
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
    EmployeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Employees', key: 'id' }
    },
    SalaryStructureId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'SalaryStructures', key: 'id' }
    },
    ctcAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    basicAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true // optional override
    },
    effectiveFrom: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    effectiveTo: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    remarks: {
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
  });

  return EmployeeSalaryAssignment;
};
