module.exports = (sequelize, DataTypes) => {
  const FinancialPeriod = sequelize.define('FinancialPeriod', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    periodName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lockedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    lockedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    unlockedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    unlockedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  });

  return FinancialPeriod;
};
