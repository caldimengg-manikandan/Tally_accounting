module.exports = (sequelize, DataTypes) => {
  const CreditNote = sequelize.define('CreditNote', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    creditNoteNumber: {
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
    accountsReceivableId: DataTypes.UUID, // Link to Ledger (AR)
    salesperson: DataTypes.STRING,
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
    customerNotes: DataTypes.TEXT,
    termsConditions: DataTypes.TEXT,
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    customerLedgerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    VoucherId: DataTypes.UUID
  });

  CreditNote.associate = (models) => {
    CreditNote.hasMany(models.CreditNoteItem, { as: 'items', foreignKey: 'CreditNoteId' });
    CreditNote.belongsTo(models.Company);
    CreditNote.belongsTo(models.Ledger, { as: 'Customer', foreignKey: 'customerLedgerId' });
    CreditNote.belongsTo(models.Ledger, { as: 'ARAccount', foreignKey: 'accountsReceivableId' });
  };

  return CreditNote;
};
