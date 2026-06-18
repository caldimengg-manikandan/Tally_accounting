module.exports = (sequelize, DataTypes) => {
  const TdsEntry = sequelize.define('TdsEntry', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tdsSection: {
      type: DataTypes.STRING,
      allowNull: false
    },
    grossAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false
    },
    tdsRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    tdsAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false
    },
    pan: {
      type: DataTypes.STRING,
      allowNull: true
    },
    quarter: {
      type: DataTypes.STRING, // e.g. "Q1 FY2025-26"
      allowNull: true
    },
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    vendorId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    paymentVoucherId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  });

  TdsEntry.associate = (models) => {
    TdsEntry.belongsTo(models.Company);
    TdsEntry.belongsTo(models.Ledger, { as: 'Vendor', foreignKey: 'vendorId' });
    TdsEntry.belongsTo(models.Voucher, { as: 'PaymentVoucher', foreignKey: 'paymentVoucherId' });
  };

  return TdsEntry;
};
