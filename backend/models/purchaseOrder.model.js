module.exports = (sequelize, DataTypes) => {
  const PurchaseOrder = sequelize.define('PurchaseOrder', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
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
    }
  });

  return PurchaseOrder;
};
