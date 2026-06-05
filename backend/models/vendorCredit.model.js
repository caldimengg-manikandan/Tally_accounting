module.exports = (sequelize, DataTypes) => {
  const VendorCredit = sequelize.define('VendorCredit', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    CreatedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    ModifiedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    vendorCreditNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    referenceNumber: DataTypes.STRING,
    date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Open', 'Closed', 'Void'),
      defaultValue: 'Draft'
    },
    accountsPayableId: DataTypes.UUID, // Link to Ledger (AP)
    subject: DataTypes.TEXT,
    subTotal: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0
    },
    discount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0
    },
    taxAmount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0
    },
    adjustment: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0
    },
    totalAmount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false
    },
    tdsAmount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0
    },
    tdsRate: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0
    },
    tdsName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    vendorNotes: DataTypes.TEXT,
    termsConditions: DataTypes.TEXT,
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    vendorLedgerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    VoucherId: DataTypes.UUID,
    ProjectId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  });

  VendorCredit.associate = (models) => {
    VendorCredit.hasMany(models.VendorCreditItem, { as: 'items', foreignKey: 'VendorCreditId' });
    VendorCredit.belongsTo(models.Company, { foreignKey: 'CompanyId' });
    VendorCredit.belongsTo(models.Ledger, { as: 'Vendor', foreignKey: 'vendorLedgerId' });
    VendorCredit.belongsTo(models.Ledger, { as: 'APAccount', foreignKey: 'accountsPayableId' });
  };

  return VendorCredit;
};
