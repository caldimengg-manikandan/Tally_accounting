module.exports = (sequelize, DataTypes) => {
  const DeliveryChallan = sequelize.define('DeliveryChallan', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    challanNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    referenceNumber: DataTypes.STRING,
    date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    challanType: {
      type: DataTypes.STRING,
      defaultValue: 'Supply' // Supply, Job Work, etc.
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Open', 'Delivered', 'Invoiced', 'Void'),
      defaultValue: 'Draft'
    },
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
    }
  });

  DeliveryChallan.associate = (models) => {
    DeliveryChallan.hasMany(models.DeliveryChallanItem, { as: 'items', foreignKey: 'DeliveryChallanId' });
    DeliveryChallan.belongsTo(models.Company);
    DeliveryChallan.belongsTo(models.Ledger, { as: 'Customer', foreignKey: 'customerLedgerId' });
  };

  return DeliveryChallan;
};
