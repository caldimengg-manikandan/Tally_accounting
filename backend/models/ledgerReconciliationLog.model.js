module.exports = (sequelize, DataTypes) => {
  const LedgerReconciliationLog = sequelize.define('LedgerReconciliationLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    LedgerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    computedBalance: {
      type: DataTypes.DECIMAL(18, 2),
      defaultValue: 0.00
    },
    storedBalance: {
      type: DataTypes.DECIMAL(18, 2),
      defaultValue: 0.00
    },
    variance: {
      type: DataTypes.DECIMAL(18, 2),
      defaultValue: 0.00
    },
    reconciledAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  return LedgerReconciliationLog;
};
