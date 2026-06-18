module.exports = (sequelize, DataTypes) => {
  const PaymentWebhookLog = sequelize.define('PaymentWebhookLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    gatewayId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'gateway_id'
    },
    eventType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'event_type'
    },
    payload: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const raw = this.getDataValue('payload');
        try { return raw ? JSON.parse(raw) : null; } catch { return raw; }
      },
      set(val) {
        this.setDataValue('payload', val ? JSON.stringify(val) : null);
      }
    },
    signature: {
      type: DataTypes.STRING,
      allowNull: true
    },
    processed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'processed_at'
    }
  }, {
    tableName: 'payment_webhook_logs',
    timestamps: true,
    underscored: true
  });

  PaymentWebhookLog.associate = (models) => {
    PaymentWebhookLog.belongsTo(models.PaymentGateway, { foreignKey: 'gatewayId' });
  };

  return PaymentWebhookLog;
};
