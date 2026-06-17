const { BOM, BOMItem, ProductionOrder, Item, Ledger, Group, Voucher, Transaction, sequelize } = require('../../models');
const { Op } = require('sequelize');
const AccountingService = require('../../services/AccountingService');

// --- BOM CRUD ---
exports.createBOM = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { name, finishedGoodItemId, quantity, description, ingredients, companyId } = req.body;

    const bom = await BOM.create({
      name,
      finishedGoodItemId,
      quantity: parseFloat(quantity || 1.00),
      description,
      CompanyId: companyId
    }, { transaction: t });

    if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
      const items = ingredients.map(ing => ({
        BOMId: bom.id,
        rawMaterialItemId: ing.rawMaterialItemId,
        quantity: parseFloat(ing.quantity || 0),
        CompanyId: companyId
      }));
      await BOMItem.bulkCreate(items, { transaction: t });
    }

    await t.commit();
    res.status(201).json(bom);
  } catch (err) {
    if (t) await t.rollback();
    next(err);
  }
};

exports.getBOMs = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const boms = await BOM.findAll({
      where: { CompanyId: companyId },
      include: [
        { model: Item, as: 'FinishedGood', attributes: ['name', 'unit'] },
        { 
          model: BOMItem, 
          as: 'ingredients',
          include: [{ model: Item, as: 'RawMaterial', attributes: ['name', 'unit', 'costPrice'] }]
        }
      ]
    });
    res.json(boms);
  } catch (err) {
    next(err);
  }
};

exports.deleteBOM = async (req, res, next) => {
  try {
    const bom = await BOM.findByPk(req.params.id);
    if (!bom) return res.status(404).json({ error: 'BOM not found' });
    await bom.destroy();
    res.json({ message: 'BOM deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// --- Production Order Engine ---
exports.createProductionOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { productionOrderNumber, BOMId, quantity, date, companyId } = req.body;

    const bom = await BOM.findByPk(BOMId, {
      include: [{ model: BOMItem, as: 'ingredients', include: [{ model: Item, as: 'RawMaterial' }] }],
      transaction: t
    });

    if (!bom) {
      await t.rollback();
      return res.status(404).json({ error: 'BOM recipe not found.' });
    }

    const orderQty = parseFloat(quantity || 1);
    const bomQty = parseFloat(bom.quantity || 1);
    const multiplier = orderQty / bomQty;

    let totalRawCost = 0;

    // 1. Process Raw Materials Consumption
    for (const ing of bom.ingredients) {
      const rawItem = ing.RawMaterial;
      if (!rawItem) continue;

      const requiredQty = parseFloat(ing.quantity) * multiplier;
      
      // Stock updates: reduce raw material stock
      rawItem.currentStock = parseFloat((parseFloat(rawItem.currentStock || 0) - requiredQty).toFixed(4));
      await rawItem.save({ transaction: t });

      const itemCost = parseFloat(rawItem.costPrice || 0) * requiredQty;
      totalRawCost += itemCost;
    }

    // 2. Process Finished Good stock increment
    const finishedItem = await Item.findByPk(bom.finishedGoodItemId, { transaction: t });
    if (!finishedItem) {
      await t.rollback();
      return res.status(404).json({ error: 'Finished Good item not found.' });
    }

    finishedItem.currentStock = parseFloat((parseFloat(finishedItem.currentStock || 0) + orderQty).toFixed(4));
    await finishedItem.save({ transaction: t });

    // 3. Ledger Postings:
    // DEBIT  → Finished Goods Inventory/Stock Ledger (Asset)
    // CREDIT → Raw Materials Stock/Consumption Ledger (Expense/Asset)
    let finishedStockLedger = await Ledger.findOne({
      where: { CompanyId: companyId, name: { [Op.like]: '%Stock-in-Hand%' } },
      transaction: t
    });
    if (!finishedStockLedger) {
      finishedStockLedger = await Ledger.findOne({
        where: { CompanyId: companyId, name: { [Op.like]: '%Inventory%' } },
        transaction: t
      });
    }
    if (!finishedStockLedger) {
      const assetGroup = await Group.findOne({ where: { CompanyId: companyId, name: { [Op.like]: '%Current%Asset%' } }, transaction: t });
      finishedStockLedger = await Ledger.create({
        name: 'Stock-in-Hand', code: 'AST-INV01', category: 'Asset', groupName: 'Current Assets',
        GroupId: assetGroup ? assetGroup.id : null, CompanyId: companyId, currentBalance: 0
      }, { transaction: t });
    }

    let rawConsumptionLedger = await Ledger.findOne({
      where: { CompanyId: companyId, name: { [Op.like]: '%Consumption%' } },
      transaction: t
    });
    if (!rawConsumptionLedger) {
      const expGroup = await Group.findOne({ where: { CompanyId: companyId, name: { [Op.like]: '%Direct%Expense%' } }, transaction: t });
      rawConsumptionLedger = await Ledger.create({
        name: 'Raw Material Consumption', code: 'EXP-MFG01', category: 'Expense', groupName: 'Direct Expenses',
        GroupId: expGroup ? expGroup.id : null, CompanyId: companyId, currentBalance: 0
      }, { transaction: t });
    }

    const finalCost = parseFloat(totalRawCost.toFixed(2));
    const journalEntries = [
      { ledgerId: finishedStockLedger.id, debit: finalCost, credit: 0 },
      { ledgerId: rawConsumptionLedger.id, debit: 0, credit: finalCost }
    ];

    const voucher = await AccountingService.recordJournalEntry({
      companyId,
      date: date || new Date(),
      voucherType: 'Journal',
      narration: `Manufacturing Production Order #${productionOrderNumber}. Finished Goods: ${orderQty} ${finishedItem.unit} of "${finishedItem.name}". Total Raw Materials Cost: ₹${finalCost.toFixed(2)}`,
      entries: journalEntries,
      userId: req.user?.id
    }, t);

    // Save ProductionOrder log
    const order = await ProductionOrder.create({
      productionOrderNumber,
      BOMId,
      finishedGoodItemId: bom.finishedGoodItemId,
      quantity: orderQty,
      date: date || new Date(),
      status: 'Completed',
      VoucherId: voucher.id,
      CompanyId: companyId
    }, { transaction: t });

    await t.commit();
    res.status(201).json(order);
  } catch (err) {
    if (t) await t.rollback();
    console.error('Manufacturing Error:', err);
    next(err);
  }
};

exports.getProductionOrders = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const orders = await ProductionOrder.findAll({
      where: { CompanyId: companyId },
      include: [
        { model: BOM, attributes: ['name'] },
        { model: Item, as: 'FinishedGood', attributes: ['name', 'unit'] },
        { model: Voucher, attributes: ['voucherNumber'] }
      ],
      order: [['date', 'DESC']]
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
};
