const { Item, AuditLog, User } = require('../../models');
const AuditService = require('../../services/AuditService');
const fs = require('fs');
const path = require('path');

const logToFile = (msg) => {
  const logPath = path.join(__dirname, '../../debug.log');
  fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
};

exports.createItem = async (req, res) => {
  try {
    const { 
      name, unit, openingStock, standardRate, companyId,
      type, sellingPrice, salesAccount, salesDescription,
      costPrice, purchaseAccount, purchaseDescription, preferredVendor, imageUrl,
      salesInformation, purchaseInformation
    } = req.body;
    
    const item = await Item.create({
      name,
      unit,
      openingStock: openingStock || 0,
      currentStock: openingStock || 0,
      standardRate: standardRate || 0,
      type: type || 'Goods',
      sellingPrice: sellingPrice || 0,
      salesAccount: salesAccount || 'Sales',
      salesDescription,
      costPrice: costPrice || 0,
      purchaseAccount: purchaseAccount || 'Cost of Goods Sold',
      purchaseDescription,
      preferredVendor,
      imageUrl,
      salesInformation: salesInformation !== undefined ? salesInformation : true,
      purchaseInformation: purchaseInformation !== undefined ? purchaseInformation : true,
      CompanyId: companyId
    });

    await AuditService.log({
      action: 'CREATE_ITEM',
      tableName: 'Items',
      recordId: item.id,
      newData: item,
      companyId: item.CompanyId,
      userId: req.user?.id,
      req
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getItems = async (req, res) => {
  try {
    const { companyId } = req.params;
    const items = await Item.findAll({ where: { CompanyId: companyId } });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity, type } = req.body; // type: 'add' or 'subtract'
    const item = await Item.findByPk(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const oldData = { id: item.id, currentStock: item.currentStock };
    const newStock = type === 'add' 
      ? parseFloat(item.currentStock) + parseFloat(quantity)
      : parseFloat(item.currentStock) - parseFloat(quantity);
    
    await item.update({ currentStock: newStock });

    await AuditService.log({
      action: 'UPDATE_STOCK',
      tableName: 'Items',
      recordId: item.id,
      oldData,
      newData: { id: item.id, currentStock: item.currentStock },
      companyId: item.CompanyId,
      userId: req.user?.id,
      req
    });

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await Item.findByPk(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const oldData = { ...item.dataValues };
    const {
      name, unit, type, sellingPrice, salesAccount, salesDescription,
      costPrice, purchaseAccount, purchaseDescription, preferredVendor, imageUrl,
      salesInformation, purchaseInformation
    } = req.body;

    await item.update({
      name, unit, type,
      sellingPrice: sellingPrice || 0,
      salesAccount: salesAccount || 'Sales',
      salesDescription,
      costPrice: costPrice || 0,
      purchaseAccount: purchaseAccount || 'Cost of Goods Sold',
      purchaseDescription,
      preferredVendor,
      imageUrl,
      salesInformation: salesInformation !== undefined ? salesInformation : true,
      purchaseInformation: purchaseInformation !== undefined ? purchaseInformation : true
    });

    await AuditService.log({
      action: 'UPDATE_ITEM',
      tableName: 'Items',
      recordId: item.id,
      oldData,
      newData: item,
      companyId: item.CompanyId,
      userId: req.user?.id,
      req
    });

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getItemHistory = async (req, res) => {
  try {
    const { itemId } = req.params;
    logToFile(`Fetching history for item: ${itemId}`);
    
    const logs = await AuditLog.findAll({
      where: {
        tableName: 'Items',
        recordId: itemId
      },
      include: [{
        model: User,
        attributes: ['name']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    logToFile(`Found ${logs.length} history records.`);
    res.json(logs);
  } catch (err) {
    logToFile(`[CRITICAL] History error: ${err.message}\n${err.stack}`);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteItem = async (req, res) => {
  const { itemId } = req.params;
  try {
    const item = await Item.findByPk(itemId);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const oldData = item.get({ plain: true });
    const companyId = item.CompanyId;

    await item.destroy();

    // Send response immediately to avoid connection issues
    res.json({ message: 'Item deleted successfully' });

    // Handle audit log asynchronously after response
    AuditService.log({
      action: 'DELETE_ITEM',
      tableName: 'Items',
      recordId: itemId,
      oldData,
      companyId,
      userId: req.user?.id,
      req
    }).catch(err => console.error('[Audit Error]:', err.message));

  } catch (err) {
    console.error('[INVENTORY DELETE ERROR]:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to delete item' });
    }
  }
};
