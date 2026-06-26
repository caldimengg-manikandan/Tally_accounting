module.exports = (sequelize, DataTypes) => {
  const UserCompany = sequelize.define('UserCompany', {
    role: {
      type: DataTypes.ENUM('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'VIEWER', 'EMPLOYEE'),
      defaultValue: 'VIEWER'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      field: 'userId'
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      field: 'companyId'
    },
    customRoleId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  });

  return UserCompany;
};
