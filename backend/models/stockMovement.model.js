module.exports = (sequelize, DataTypes) => {
  const StockMovement = sequelize.define('StockMovement', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    movementType: {
      type: DataTypes.ENUM('PURCHASE', 'SALE', 'TRANSFER', 'ADJUSTMENT', 'OPENING'),
      allowNull: false
    },
    quantity: {
      type: DataTypes.DECIMAL(14, 4),
      allowNull: false,
      comment: 'Positive for IN, Negative for OUT'
    },
    rate: {
      type: DataTypes.DECIMAL(14, 4),
      defaultValue: 0
    },
    amount: {
      type: DataTypes.DECIMAL(18, 2),
      defaultValue: 0
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // Hooks to sync Item currentStock
  const updateItemStock = async (stockMovement, options) => {
    // Requires are here to avoid circular dependencies
    const { Item, StockMovement: SM, SystemMail } = require('./index');
    
    const itemId = stockMovement.ItemId;
    if (!itemId) return;

    // Calculate sum of all movements for this item
    const totalStock = await SM.sum('quantity', {
      where: { ItemId: itemId },
      transaction: options.transaction
    });

    const newStock = totalStock || 0;

    await Item.update(
      { currentStock: newStock },
      { 
        where: { id: itemId },
        transaction: options.transaction 
      }
    );

    const item = await Item.findByPk(itemId, { transaction: options.transaction });
    if (item && item.CompanyId) {
      if (newStock <= 0) {
        await SystemMail.create({
          subject: 'Out of Stock Alert',
          body: `Item ${item.name} is out of stock. Current stock: ${newStock}`,
          toEmail: 'admin@company.com',
          type: 'Alert',
          CompanyId: item.CompanyId
        }, { transaction: options.transaction });
      } else if (item.reorderLevel > 0 && newStock < item.reorderLevel) {
        await SystemMail.create({
          subject: 'Low Stock Alert',
          body: `Item ${item.name} is running low. Current stock: ${newStock}, Reorder Level: ${item.reorderLevel}`,
          toEmail: 'admin@company.com',
          type: 'Alert',
          CompanyId: item.CompanyId
        }, { transaction: options.transaction });
      }
    }
  };

  StockMovement.afterCreate(updateItemStock);
  StockMovement.afterUpdate(updateItemStock);
  StockMovement.afterDestroy(updateItemStock);

  return StockMovement;
};
