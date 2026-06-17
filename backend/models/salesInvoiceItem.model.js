module.exports = (sequelize, DataTypes) => {
  const SalesInvoiceItem = sequelize.define('SalesInvoiceItem', {
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
    SalesInvoiceId: DataTypes.UUID,
    projectId: DataTypes.UUID
  });

  SalesInvoiceItem.associate = (models) => {
    SalesInvoiceItem.belongsTo(models.SalesInvoice);
    SalesInvoiceItem.belongsTo(models.Item, { foreignKey: 'itemId' });
    SalesInvoiceItem.belongsTo(models.Project, { foreignKey: 'projectId', as: 'Project' });
  };

  return SalesInvoiceItem;
};
