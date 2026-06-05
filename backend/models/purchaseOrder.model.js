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
      type: DataTypes.ENUM('Draft', 'Sent', 'Received', 'Billed', 'Cancelled'),
      defaultValue: 'Draft'
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
