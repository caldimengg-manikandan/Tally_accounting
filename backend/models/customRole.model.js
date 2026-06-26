module.exports = (sequelize, DataTypes) => {
  const CustomRole = sequelize.define('CustomRole', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    baseRole: {
      type: DataTypes.ENUM('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'VIEWER', 'EMPLOYEE'),
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  });

  return CustomRole;
};
