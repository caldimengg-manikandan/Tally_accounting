module.exports = (sequelize, DataTypes) => {
  const PaymentTransaction = sequelize.define('PaymentTransaction', {
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
    gatewayId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'gateway_id'
    },
    gatewayTransactionId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'gateway_transaction_id'
    },
    gatewayPaymentLinkId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'gateway_payment_link_id'
    },
    amount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'INR'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending'
    },
    gatewayResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'gateway_response',
      get() {
        const raw = this.getDataValue('gatewayResponse');
        try { return raw ? JSON.parse(raw) : null; } catch { return raw; }
      },
      set(val) {
        this.setDataValue('gatewayResponse', val ? JSON.stringify(val) : null);
      }
    },
    paymentReference: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'payment_reference'
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'paid_at'
    },
    // Refund details
    refundAmount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0.00,
      field: 'refund_amount'
    },
    refundStatus: {
      type: DataTypes.STRING,
      defaultValue: 'none',
      field: 'refund_status'
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'refunded_at'
    },
    // Settlement details
    settlementId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'settlement_id'
    },
    settledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'settled_at'
    },
    settlementAmount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0.00,
      field: 'settlement_amount'
    },
    gatewayFee: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0.00,
      field: 'gateway_fee'
    },
    gatewayFeeGst: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0.00,
      field: 'gateway_fee_gst'
    }
  }, {
    tableName: 'payment_transactions',
    timestamps: true,
    underscored: true
  });

  PaymentTransaction.associate = (models) => {
    PaymentTransaction.belongsTo(models.Company, { foreignKey: 'companyId' });
    PaymentTransaction.belongsTo(models.SalesInvoice, { foreignKey: 'invoiceId' });
    PaymentTransaction.belongsTo(models.PaymentGateway, { foreignKey: 'gatewayId' });
    PaymentTransaction.hasMany(models.InvoicePayment, { foreignKey: 'transactionId' });
  };

  return PaymentTransaction;
};
