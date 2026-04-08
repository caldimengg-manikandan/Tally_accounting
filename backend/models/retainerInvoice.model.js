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
    status: {
      type: DataTypes.ENUM('Draft', 'Sent', 'Partial', 'Paid', 'Void'),
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
