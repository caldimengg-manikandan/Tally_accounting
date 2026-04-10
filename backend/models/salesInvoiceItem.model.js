module.exports = (sequelize, DataTypes) => {
  const SalesInvoiceItem = sequelize.define('SalesInvoiceItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    description: DataTypes.TEXT,
    quantity: {
      type: DataTypes.DECIMAL(20, 3),
      defaultValue: 1
    },
    rate: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0
    },
    amount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0
    },
    itemId: DataTypes.UUID,
    SalesInvoiceId: DataTypes.UUID
  });

  SalesInvoiceItem.associate = (models) => {
    SalesInvoiceItem.belongsTo(models.SalesInvoice);
    SalesInvoiceItem.belongsTo(models.Item, { foreignKey: 'itemId' });
  };

  return SalesInvoiceItem;
};
