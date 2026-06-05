module.exports = (sequelize, DataTypes) => {
  const SalesOrder = sequelize.define('SalesOrder', {
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
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Sent', 'Accepted', 'Closed', 'Declined', 'Expired'),
      defaultValue: 'Draft'
    },
    referenceNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    expectedShipmentDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    paymentTerms: {
      type: DataTypes.STRING,
      defaultValue: 'Due on Receipt'
    },
    deliveryMethod: {
      type: DataTypes.STRING,
      allowNull: true
    },
    salesperson: {
      type: DataTypes.STRING,
      allowNull: true
    },
    customerNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    termsConditions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    subTotal: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    discount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    tax: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    adjustment: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true
    },
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    ProjectId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    LedgerId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  });

  SalesOrder.associate = (models) => {
    SalesOrder.belongsTo(models.Company, { foreignKey: 'CompanyId' });
    SalesOrder.belongsTo(models.Ledger, { as: 'Customer', foreignKey: 'LedgerId' });
    SalesOrder.belongsTo(models.Project, { foreignKey: 'ProjectId' });
    SalesOrder.hasMany(models.SalesOrderItem, { as: 'Items', foreignKey: 'SalesOrderId', onDelete: 'CASCADE' });
  };

  return SalesOrder;
};
