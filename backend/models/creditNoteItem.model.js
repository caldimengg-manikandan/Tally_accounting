module.exports = (sequelize, DataTypes) => {
  const CreditNoteItem = sequelize.define('CreditNoteItem', {
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
    accountId: DataTypes.UUID, // Link to Ledger (e.g., Sales Returns)
    CreditNoteId: DataTypes.UUID
  });

  CreditNoteItem.associate = (models) => {
    CreditNoteItem.belongsTo(models.CreditNote);
    CreditNoteItem.belongsTo(models.Item, { foreignKey: 'itemId' });
    CreditNoteItem.belongsTo(models.Ledger, { as: 'Account', foreignKey: 'accountId' });
  };

  return CreditNoteItem;
};
