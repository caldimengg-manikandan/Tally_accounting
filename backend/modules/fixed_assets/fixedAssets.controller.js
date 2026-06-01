const { FixedAsset, DepreciationLog, Ledger, Group, Voucher, Transaction, sequelize } = require('../../models');
const { Op } = require('sequelize');
const AccountingService = require('../../services/AccountingService');

// Create Asset
exports.createAsset = async (req, res) => {
  try {
    const { name, purchaseDate, purchaseValue, depreciationMethod, usefulLife, scrapValue, assetLedgerId, depreciationLedgerId, companyId } = req.body;
    
    // Auto-create or resolve ledgers
    let resolvedAssetLedgerId = assetLedgerId;
    if (!resolvedAssetLedgerId) {
      // Find asset-related ledger or create one
      const assetGroup = await Group.findOne({ where: { CompanyId: companyId, name: { [Op.like]: '%Fixed%Asset%' } } });
      const assetLedger = await Ledger.create({
        name: `${name} Asset`, code: 'AST-' + Date.now().toString().slice(-4), category: 'Asset', groupName: 'Fixed Assets',
        GroupId: assetGroup ? assetGroup.id : null, CompanyId: companyId, currentBalance: parseFloat(purchaseValue || 0),
        openingBalance: parseFloat(purchaseValue || 0)
      });
      resolvedAssetLedgerId = assetLedger.id;
    }

    let resolvedDepreciationLedgerId = depreciationLedgerId;
    if (!resolvedDepreciationLedgerId) {
      const expGroup = await Group.findOne({ where: { CompanyId: companyId, name: { [Op.like]: '%Indirect%Expense%' } } });
      const depLedger = await Ledger.create({
        name: 'Depreciation Expense', code: 'EXP-DEP01', category: 'Expense', groupName: 'Indirect Expenses',
        GroupId: expGroup ? expGroup.id : null, CompanyId: companyId, currentBalance: 0
      });
      resolvedDepreciationLedgerId = depLedger.id;
    }

    const val = parseFloat(purchaseValue || 0);
    const asset = await FixedAsset.create({
      name,
      purchaseDate,
      purchaseValue: val,
      depreciationMethod: depreciationMethod || 'WDV',
      usefulLife: parseInt(usefulLife || 10),
      scrapValue: parseFloat(scrapValue || 0),
      currentBookValue: val,
      accumulatedDepreciation: 0,
      assetLedgerId: resolvedAssetLedgerId,
      depreciationLedgerId: resolvedDepreciationLedgerId,
      CompanyId: companyId
    });

    res.status(201).json(asset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// List Assets
exports.getAssets = async (req, res) => {
  try {
    const { companyId } = req.params;
    const assets = await FixedAsset.findAll({
      where: { CompanyId: companyId },
      include: [
        { model: DepreciationLog },
        { model: Ledger, as: 'AssetLedger', attributes: ['name'] }
      ]
    });
    res.json(assets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Asset
exports.updateAsset = async (req, res) => {
  try {
    const asset = await FixedAsset.findByPk(req.params.id);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    await asset.update(req.body);
    res.json(asset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Asset
exports.deleteAsset = async (req, res) => {
  try {
    const asset = await FixedAsset.findByPk(req.params.id);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    await asset.destroy();
    res.json({ message: 'Asset deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Run Depreciation Calculation & Post Journal Voucher
exports.depreciateAsset = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { date } = req.body; // Date of running depreciation

    const asset = await FixedAsset.findByPk(id, { transaction: t });
    if (!asset) {
      await t.rollback();
      return res.status(404).json({ error: 'Asset not found' });
    }

    const bookValue = parseFloat(asset.currentBookValue || 0);
    const scrap = parseFloat(asset.scrapValue || 0);
    const life = parseInt(asset.usefulLife || 10);

    if (bookValue <= scrap) {
      await t.rollback();
      return res.status(400).json({ error: 'Asset has already depreciated to scrap value.' });
    }

    let depAmount = 0;
    if (asset.depreciationMethod === 'SLM') {
      depAmount = (parseFloat(asset.purchaseValue) - scrap) / life;
    } else {
      // WDV Method: Double Declining Balance (2.0 / usefulLife)
      depAmount = bookValue * (2.0 / life);
    }

    // Ensure we don't depreciate below scrap value
    if (bookValue - depAmount < scrap) {
      depAmount = bookValue - scrap;
    }

    depAmount = parseFloat(depAmount.toFixed(2));
    if (depAmount <= 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Depreciation amount calculated is zero.' });
    }

    const valueBefore = bookValue;
    const valueAfter = parseFloat((bookValue - depAmount).toFixed(2));

    // 1. Post Journal Entry
    // DEBIT  → Depreciation Expense Ledger
    // CREDIT → Asset Ledger
    const journalEntries = [
      { ledgerId: asset.depreciationLedgerId, debit: depAmount, credit: 0 },
      { ledgerId: asset.assetLedgerId, debit: 0, credit: depAmount }
    ];

    const voucher = await AccountingService.recordJournalEntry({
      companyId: asset.CompanyId,
      date: date || new Date(),
      voucherType: 'Journal',
      narration: `Depreciation run for ${asset.name}. Value before: ₹${valueBefore.toFixed(2)}, Value after: ₹${valueAfter.toFixed(2)}`,
      entries: journalEntries,
      userId: req.user?.id
    }, t);

    // 2. Log Depreciation record
    const log = await DepreciationLog.create({
      FixedAssetId: asset.id,
      date: date || new Date(),
      amount: depAmount,
      bookValueBefore: valueBefore,
      bookValueAfter: valueAfter,
      VoucherId: voucher.id,
      CompanyId: asset.CompanyId
    }, { transaction: t });

    // 3. Update FixedAsset record WDV
    await asset.update({
      currentBookValue: valueAfter,
      accumulatedDepreciation: parseFloat((parseFloat(asset.accumulatedDepreciation || 0) + depAmount).toFixed(2))
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ message: 'Depreciation posted successfully', log, asset });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ error: err.message });
  }
};

// Asset Disposal Endpoint
exports.disposeAsset = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { disposalDate, disposalValue, bankLedgerId } = req.body;

    const asset = await FixedAsset.findByPk(id, { transaction: t });
    if (!asset) {
      await t.rollback();
      return res.status(404).json({ error: 'Asset not found' });
    }

    const bookValue = parseFloat(asset.currentBookValue || 0);
    const saleValue = parseFloat(disposalValue || 0);
    const gainLoss = saleValue - bookValue;

    // Resolve Gain/Loss ledger
    let gainLossLedger = await Ledger.findOne({
      where: { CompanyId: asset.CompanyId, name: { [Op.like]: '%Gain%Loss%Asset%' } },
      transaction: t
    });
    if (!gainLossLedger) {
      const incGroup = await Group.findOne({ where: { CompanyId: asset.CompanyId, name: { [Op.like]: '%Indirect%Income%' } }, transaction: t });
      gainLossLedger = await Ledger.create({
        name: 'Gain/Loss on Asset Sale', code: 'INC-AST01', category: 'Income', groupName: 'Indirect Incomes',
        GroupId: incGroup ? incGroup.id : null, CompanyId: asset.CompanyId, currentBalance: 0
      }, { transaction: t });
    }

    const journalEntries = [];

    // 1. Debit Cash/Bank for the sale proceeds
    journalEntries.push({ ledgerId: bankLedgerId, debit: saleValue, credit: 0 });

    // 2. Credit the Asset Ledger to remove the book value
    journalEntries.push({ ledgerId: asset.assetLedgerId, debit: 0, credit: bookValue });

    // 3. Balance the entry with Gain or Loss
    if (gainLoss > 0) {
      // Gain: Credit Income/Gain ledger
      journalEntries.push({ ledgerId: gainLossLedger.id, debit: 0, credit: gainLoss });
    } else if (gainLoss < 0) {
      // Loss: Debit Expense/Loss ledger
      journalEntries.push({ ledgerId: gainLossLedger.id, debit: Math.abs(gainLoss), credit: 0 });
    }

    // Post disposal Journal Voucher
    const voucher = await AccountingService.recordJournalEntry({
      companyId: asset.CompanyId,
      date: disposalDate || new Date(),
      voucherType: 'Journal',
      narration: `Asset Disposal: ${asset.name} sold for ₹${saleValue.toFixed(2)}. Net Book Value: ₹${bookValue.toFixed(2)}. Gain/Loss: ₹${gainLoss.toFixed(2)}`,
      entries: journalEntries,
      userId: req.user?.id
    }, t);

    // Update asset record as retired (0 book value)
    await asset.update({
      currentBookValue: 0,
      description: `Disposed on ${disposalDate || new Date().toLocaleDateString()} for sale value of ₹${saleValue}`
    }, { transaction: t });

    await t.commit();
    res.json({ message: 'Asset disposed successfully', voucher, gainLoss });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ error: err.message });
  }
};
