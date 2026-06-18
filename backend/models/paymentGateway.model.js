module.exports = (sequelize, DataTypes) => {
  const PaymentGateway = sequelize.define('PaymentGateway', {
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
    provider: {
      type: DataTypes.STRING,
      allowNull: false
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'display_name'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_active'
    },
    isTestMode: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_test_mode'
    },
    credentialsJson: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'credentials_json'
    },
    webhookSecret: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'webhook_secret'
    }
  }, {
    tableName: 'payment_gateways',
    timestamps: true,
    underscored: true
  });

  PaymentGateway.associate = (models) => {
    PaymentGateway.belongsTo(models.Company, { foreignKey: 'companyId' });
  };

  return PaymentGateway;
};
