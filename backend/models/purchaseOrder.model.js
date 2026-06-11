module.exports = (sequelize, DataTypes) => {
  const PurchaseOrder = sequelize.define('PurchaseOrder', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    CreatedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    ModifiedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: DataTypes.NOW
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    status: {
      type: DataTypes.ENUM('draft', 'issued', 'partially_received', 'received', 'cancelled'),
      defaultValue: 'draft'
    },
    billed_status: {
      type: DataTypes.ENUM('yet_to_be_billed', 'partially_billed', 'billed'),
      defaultValue: 'yet_to_be_billed'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tdsAmount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0
    },
    tdsRate: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0
    },
    tdsName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    deliveryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    paymentTerms: {
      type: DataTypes.STRING,
      allowNull: true
    },
    shipmentPreference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    deliveryAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    deliveryAddressText: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    deliveryAddressDataJson: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    itemsJson: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    discount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    adjustment: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    taxRate: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    discountAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    taxAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    subtotal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    terms: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    emailContactsJson: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    ProjectId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  });

  return PurchaseOrder;
};
