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
      type: DataTypes.ENUM('Draft', 'Confirmed', 'Sent', 'Partially Paid', 'Paid', 'Void', 'Overdue', 'Overpaid'),
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
    },
    paymentStatus: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
      field: 'payment_status'
    },
    paymentGatewayId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'payment_gateway_id'
    },
    paymentLink: {
      type: DataTypes.STRING(1024),
      allowNull: true,
      field: 'payment_link'
    },
    paymentReference: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'payment_reference'
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'payment_date'
    },
    shareToken: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      field: 'share_token'
    },
    shareExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'share_expires_at'
    }
  });

  SalesInvoice.associate = (models) => {
    SalesInvoice.hasMany(models.SalesInvoiceItem, { as: 'items', foreignKey: 'SalesInvoiceId' });
    SalesInvoice.belongsTo(models.Company);
    SalesInvoice.belongsTo(models.Ledger, { as: 'CustomerLedger', foreignKey: 'customerLedgerId' });
    SalesInvoice.hasMany(models.InvoicePayment, { as: 'payments', foreignKey: 'invoiceId' });
    SalesInvoice.belongsTo(models.PaymentGateway, { as: 'PaymentGateway', foreignKey: 'paymentGatewayId' });
  };

  return SalesInvoice;
};
