module.exports = (sequelize, DataTypes) => {
  const SalesInvoice = sequelize.define('SalesInvoice', {
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
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    orderNumber: DataTypes.STRING,
    date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    dueDate: DataTypes.DATE,
    status: {
      type: DataTypes.ENUM('Draft', 'Confirmed', 'Sent', 'Partially Paid', 'Paid', 'Void', 'Overdue'),
      defaultValue: 'Draft'
    },
    amountPaid: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0
    },
    balance: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0
    },
    terms: DataTypes.STRING,
    salesperson: DataTypes.STRING,
    subject: DataTypes.TEXT,
    subTotal: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0
    },
    discountAmount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0
    },
    discountPercent: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    gstAmount: {
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
    VoucherId: DataTypes.UUID, // Linked after confirmation
    ProjectId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  });

  SalesInvoice.associate = (models) => {
    SalesInvoice.hasMany(models.SalesInvoiceItem, { as: 'items', foreignKey: 'SalesInvoiceId' });
    SalesInvoice.belongsTo(models.Company);
    SalesInvoice.belongsTo(models.Ledger, { as: 'CustomerLedger', foreignKey: 'customerLedgerId' });
  };

  return SalesInvoice;
};
