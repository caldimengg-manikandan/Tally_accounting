module.exports = (sequelize, DataTypes) => {
  const AppNotification = sequelize.define('AppNotification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('INFO', 'WARNING', 'ERROR', 'SUCCESS'),
      defaultValue: 'INFO'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    actionLink: {
      type: DataTypes.STRING,
      allowNull: true // Optional link to redirect the admin (e.g. to a specific invoice)
    },
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  });

  AppNotification.associate = (models) => {
    AppNotification.belongsTo(models.Company);
  };

  return AppNotification;
};
