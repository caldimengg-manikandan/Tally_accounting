module.exports = (sequelize, DataTypes) => {
  const PriceList = sequelize.define('PriceList', {
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
    transactionType: {
      type: DataTypes.ENUM('Sales', 'Purchase'),
      defaultValue: 'Sales'
    },
    priceListType: {
      type: DataTypes.ENUM('All Items', 'Individual Items'),
      defaultValue: 'All Items'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    markupType: {
      type: DataTypes.ENUM('Markup', 'Markdown'),
      defaultValue: 'Markup'
    },
    percentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    roundOffTo: {
      type: DataTypes.STRING,
      defaultValue: 'Never mind'
    },
    pricingScheme: {
      type: DataTypes.ENUM('Unit Pricing', 'Volume Pricing'),
      defaultValue: 'Unit Pricing'
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'INR - Indian Rupee'
    },
    includeDiscount: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    itemRates: {
      type: DataTypes.JSON, // Stores { itemId: customRate }
      allowNull: true
    }
  });

  return PriceList;
};
