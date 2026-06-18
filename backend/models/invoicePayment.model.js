module.exports = (sequelize, DataTypes) => {
  const InvoicePayment = sequelize.define('InvoicePayment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'company_id'
    },
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'invoice_id'
    },
    transactionId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'transaction_id'
    },
    voucherId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'voucher_id'
    },
    amount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'payment_date'
    },
    paymentMode: {
      type: DataTypes.STRING,
      defaultValue: 'Gateway',
      field: 'payment_mode'
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'invoice_payments',
    timestamps: true,
    underscored: true
  });

  InvoicePayment.associate = (models) => {
    InvoicePayment.belongsTo(models.Company, { foreignKey: 'companyId' });
    InvoicePayment.belongsTo(models.SalesInvoice, { foreignKey: 'invoiceId' });
    InvoicePayment.belongsTo(models.PaymentTransaction, { foreignKey: 'transactionId' });
    InvoicePayment.belongsTo(models.Voucher, { foreignKey: 'voucherId' });
  };

  return InvoicePayment;
};
