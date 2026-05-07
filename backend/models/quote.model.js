module.exports = (sequelize, DataTypes) => {
  const Quote = sequelize.define('Quote', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    quoteNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Sent', 'Accepted', 'Declined', 'Expired'),
      defaultValue: 'Draft'
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    customerLedgerId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    referenceNumber: { type: DataTypes.STRING, allowNull: true },
    quoteDate: { type: DataTypes.DATEONLY, allowNull: false },
    expiryDate: { type: DataTypes.DATEONLY, allowNull: true },
    salesperson: { type: DataTypes.STRING, allowNull: true },
    subject: { type: DataTypes.TEXT, allowNull: true },
    itemsJson: { type: DataTypes.TEXT, allowNull: true },   // JSON array of line items
    discount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    taxType: { type: DataTypes.STRING, allowNull: true },
    selectedTax: { type: DataTypes.STRING, allowNull: true },
    taxAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    adjustment: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    subTotal: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    totalAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    customerNotes: { type: DataTypes.TEXT, allowNull: true },
    termsConditions: { type: DataTypes.TEXT, allowNull: true },
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    ProjectId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, { paranoid: true });

  Quote.associate = (models) => {
    Quote.belongsTo(models.Company, { foreignKey: 'CompanyId' });
    Quote.belongsTo(models.Ledger, { as: 'Customer', foreignKey: 'customerLedgerId' });
    Quote.belongsTo(models.Project, { foreignKey: 'ProjectId' });
  };

  return Quote;
};
