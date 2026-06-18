const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PeriodLock = sequelize.define('PeriodLock', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    lockDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    timestamps: true,
    tableName: 'PeriodLocks'
  });

  return PeriodLock;
};
