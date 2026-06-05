module.exports = (sequelize, DataTypes) => {
  const RecurringInvoice = sequelize.define('RecurringInvoice', {
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
    templateName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    frequency: {
      type: DataTypes.ENUM('Daily', 'Weekly', 'Monthly', 'Yearly'),
      allowNull: false,
      defaultValue: 'Monthly'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE
    },
    lastGeneratedDate: {
      type: DataTypes.DATE
    },
    nextGenerationDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    itemsJson: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]'
    },
    subTotal: {
       type: DataTypes.DECIMAL(15, 2),
       defaultValue: 0
    },
    taxAmount: {
       type: DataTypes.DECIMAL(15, 2),
       defaultValue: 0
    },
    discount: {
       type: DataTypes.DECIMAL(5, 2),
       defaultValue: 0
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Active', 'Expired', 'Paused'),
      defaultValue: 'Active'
    },
    autoSend: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    invoiceType: {
       type: DataTypes.ENUM('TaxInvoice', 'RetainerInvoice'),
       defaultValue: 'TaxInvoice'
    },
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  });

  return RecurringInvoice;
};
