module.exports = (sequelize, DataTypes) => {
  const RetainerInvoice = sequelize.define('RetainerInvoice', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    referenceNumber: {
      type: DataTypes.STRING
    },
    invoiceDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    customerLedgerId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    projectName: {
      type: DataTypes.STRING
    },
    itemsJson: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      allowNull: false
    },
    amountReceived: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    amountUsed: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Sent', 'Partial', 'Paid', 'FullyApplied', 'PartiallyApplied', 'Void'),
      defaultValue: 'Draft'
    },
    customerNotes: {
      type: DataTypes.TEXT
    },
    termsConditions: {
      type: DataTypes.TEXT
    },
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  });

  return RetainerInvoice;
};
