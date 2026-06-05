module.exports = (sequelize, DataTypes) => {
  const Item = sequelize.define('Item', {
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
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    unit: {
      type: DataTypes.STRING,
      defaultValue: 'Nos'
    },
    openingStock: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    currentStock: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    type: {
      type: DataTypes.ENUM('Goods', 'Service'),
      defaultValue: 'Goods'
    },
    sellingPrice: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    salesAccount: {
      type: DataTypes.STRING,
      defaultValue: 'Sales'
    },
    salesDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    costPrice: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    purchaseAccount: {
      type: DataTypes.STRING,
      defaultValue: 'Cost of Goods Sold'
    },
    purchaseDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    preferredVendor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    standardRate: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    gstRate: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 18,
      comment: 'GST percentage (0,5,12,18,28)'
    },
    hsnCode: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'HSN/SAC code for GST'
    },
    itemCode: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'SKU or item code'
    },
    reorderLevel: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    salesInformation: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    purchaseInformation: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });

  return Item;
};
