const { FixedAsset, DepreciationLog, Ledger, Group, Voucher, Transaction, sequelize } = require('../../models');
const { Op } = require('sequelize');
const AccountingService = require('../../services/AccountingService');

// Helper to resolve or create the Accumulated Depreciation ledger for an asset
const resolveAccumulatedDepreciationLedger = async (asset, transaction) => {
  let accDepLedgerId = asset.accumulatedDepreciationLedgerId;
  if (!accDepLedgerId) {
    let accDepLedger = await Ledger.findOne({
      where: { CompanyId: asset.CompanyId, name: `${asset.name} Accumulated Depreciation` },
      transaction
    });
    if (!accDepLedger) {
      accDepLedger = await Ledger.findOne({
        where: { CompanyId: asset.CompanyId, name: 'Accumulated Depreciation' },
        transaction
      });
    }
    if (!accDepLedger) {
      const assetGroup = await Group.findOne({
        where: { CompanyId: asset.CompanyId, name: { [Op.like]: '%Fixed%Asset%' } },
        transaction
      });
      accDepLedger = await Ledger.create({
        name: `${asset.name} Accumulated Depreciation`,
        code: 'AST-ACC-' + Date.now().toString().slice(-4),
        category: 'Asset',
        groupName: 'Fixed Assets',
        GroupId: assetGroup ? assetGroup.id : null,
        CompanyId: asset.CompanyId,
        currentBalance: 0
      }, { transaction });
    }
    
    await asset.update({ accumulatedDepreciationLedgerId: accDepLedger.id }, { transaction });
    accDepLedgerId = accDepLedger.id;
  }
  return accDepLedgerId;
};

// Create Asset
exports.createAsset = async (req, res, next) => {
  try {
    const { name, purchaseDate, purchaseValue, depreciationMethod, usefulLife, scrapValue, assetLedgerId, depreciationLedgerId, companyId, depreciationRate, accumulatedDepreciationLedgerId, usefulLifeYears } = req.body;
    
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

    let resolvedAccumulatedDepreciationLedgerId = accumulatedDepreciationLedgerId;
    if (!resolvedAccumulatedDepreciationLedgerId) {
      const assetGroup = await Group.findOne({ where: { CompanyId: companyId, name: { [Op.like]: '%Fixed%Asset%' } } });
      const accDepLedger = await Ledger.create({
        name: `${name} Accumulated Depreciation`, code: 'AST-ACC-' + Date.now().toString().slice(-4), category: 'Asset', groupName: 'Fixed Assets',
        GroupId: assetGroup ? assetGroup.id : null, CompanyId: companyId, currentBalance: 0
      });
      resolvedAccumulatedDepreciationLedgerId = accDepLedger.id;
    }

    const val = parseFloat(purchaseValue || 0);
    const life = parseInt(usefulLifeYears || usefulLife || 10);
    const asset = await FixedAsset.create({
      name,
      purchaseDate,
      purchaseValue: val,
      depreciationMethod: depreciationMethod || 'WDV',
      usefulLife: life,
      usefulLifeYears: life,
      scrapValue: parseFloat(scrapValue || 0),
      depreciationRate: parseFloat(depreciationRate !== undefined ? depreciationRate : 10.0),
      currentBookValue: val,
      accumulatedDepreciation: 0,
      assetLedgerId: resolvedAssetLedgerId,
      depreciationLedgerId: resolvedDepreciationLedgerId,
      accumulatedDepreciationLedgerId: resolvedAccumulatedDepreciationLedgerId,
      CompanyId: companyId
    });

    res.status(201).json(asset);
  } catch (err) {
    next(err);
  }
};

// List Assets
exports.getAssets = async (req, res, next) => {
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
    console.error("GET_ASSETS_ERROR:", err);
    next(err);
  }
};

// Update Asset
exports.updateAsset = async (req, res, next) => {
  try {
    const asset = await FixedAsset.findOne({ where: { id: req.params.id, CompanyId: req.companyId } });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    await asset.update(req.body);
    res.json(asset);
  } catch (err) {
    next(err);
  }
};

// Delete Asset
exports.deleteAsset = async (req, res, next) => {
  try {
    const asset = await FixedAsset.findOne({ where: { id: req.params.id, CompanyId: req.companyId } });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    await asset.destroy();
    res.json({ message: 'Asset deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Run Depreciation Calculation & Post Journal Voucher
exports.depreciateAsset = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { date } = req.body; // Date of running depreciation

    const asset = await FixedAsset.findOne({ where: { id, CompanyId: req.companyId }, transaction: t });
    if (!asset) {
      await t.rollback();
      return res.status(404).json({ error: 'Asset not found' });
    }

    const bookValue = parseFloat(asset.currentBookValue || 0);
    const scrap = parseFloat(asset.scrapValue || 0);
    const lifeYears = parseInt(asset.usefulLifeYears || asset.usefulLife || 10);

    if (bookValue <= scrap) {
      await t.rollback();
      return res.status(400).json({ error: 'Asset has already depreciated to scrap value.' });
    }

    const purchase = new Date(asset.purchaseDate);
    const usefulLifeEnd = new Date(purchase);
    usefulLifeEnd.setFullYear(purchase.getFullYear() + lifeYears);

    let lastDepDate = new Date(asset.purchaseDate);
    const lastLog = await DepreciationLog.findOne({
      where: { FixedAssetId: asset.id },
      order: [['date', 'DESC']],
      transaction: t
    });
    if (lastLog) {
      lastDepDate = new Date(lastLog.date);
    }

    const runDate = new Date(date || new Date());

    if (lastDepDate >= usefulLifeEnd) {
      await t.rollback();
      return res.status(400).json({ error: 'Asset useful life has already ended.' });
    }

    if (lastDepDate >= runDate) {
      await t.rollback();
      return res.status(400).json({ error: 'Filing date must be after the last depreciation date.' });
    }

    const actualRunDate = runDate > usefulLifeEnd ? usefulLifeEnd : runDate;

    const msPerDay = 1000 * 60 * 60 * 24;
    const daysElapsed = Math.max(0, (actualRunDate.getTime() - lastDepDate.getTime()) / msPerDay);

    let annualDep = 0;
    if (asset.depreciationMethod === 'SLM') {
      annualDep = parseFloat(asset.purchaseValue) / lifeYears;
    } else {
      // WDV Method
      annualDep = bookValue * (parseFloat(asset.depreciationRate || 10) / 100);
    }

    let depAmount = annualDep * (daysElapsed / 365);

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

    // Resolve Accumulated Depreciation Ledger
    const accDepLedgerId = await resolveAccumulatedDepreciationLedger(asset, t);

    // 1. Post Journal Entry
    // DEBIT  → Depreciation Expense Ledger
    // CREDIT → Accumulated Depreciation Ledger
    const journalEntries = [
      { ledgerId: asset.depreciationLedgerId, debit: depAmount, credit: 0 },
      { ledgerId: accDepLedgerId, debit: 0, credit: depAmount }
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
    next(err);
  }
};

// Asset Disposal Endpoint
exports.disposeAsset = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { disposalDate, disposalValue, bankLedgerId } = req.body;

    const asset = await FixedAsset.findOne({ where: { id, CompanyId: req.companyId }, transaction: t });
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
    next(err);
  }
};

// Run Batch Depreciation for all active assets of a company
exports.depreciateBatch = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { companyId } = req.params;
    const { date } = req.body;

    if (companyId !== req.companyId) {
      await t.rollback();
      return res.status(403).json({ error: 'Access denied: Unauthorized company ID' });
    }

    const assets = await FixedAsset.findAll({
      where: {
        CompanyId: companyId,
        currentBookValue: { [Op.gt]: sequelize.col('scrapValue') }
      },
      transaction: t
    });

    if (assets.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'No depreciable assets found for this company.' });
    }

    const results = [];

    for (const asset of assets) {
      const bookValue = parseFloat(asset.currentBookValue || 0);
      const scrap = parseFloat(asset.scrapValue || 0);
      const lifeYears = parseInt(asset.usefulLifeYears || asset.usefulLife || 10);

      const purchase = new Date(asset.purchaseDate);
      const usefulLifeEnd = new Date(purchase);
      usefulLifeEnd.setFullYear(purchase.getFullYear() + lifeYears);

      let lastDepDate = new Date(asset.purchaseDate);
      const lastLog = await DepreciationLog.findOne({
        where: { FixedAssetId: asset.id },
        order: [['date', 'DESC']],
        transaction: t
      });
      if (lastLog) {
        lastDepDate = new Date(lastLog.date);
      }

      const runDate = new Date(date || new Date());

      if (lastDepDate >= usefulLifeEnd || lastDepDate >= runDate) {
        continue;
      }

      const actualRunDate = runDate > usefulLifeEnd ? usefulLifeEnd : runDate;

      const msPerDay = 1000 * 60 * 60 * 24;
      const daysElapsed = Math.max(0, (actualRunDate.getTime() - lastDepDate.getTime()) / msPerDay);

      let annualDep = 0;
      if (asset.depreciationMethod === 'SLM') {
        annualDep = parseFloat(asset.purchaseValue) / lifeYears;
      } else {
        // WDV Method
        annualDep = bookValue * (parseFloat(asset.depreciationRate || 10) / 100);
      }

      let depAmount = annualDep * (daysElapsed / 365);

      if (bookValue - depAmount < scrap) {
        depAmount = bookValue - scrap;
      }

      depAmount = parseFloat(depAmount.toFixed(2));
      if (depAmount <= 0) continue;

      const valueBefore = bookValue;
      const valueAfter = parseFloat((bookValue - depAmount).toFixed(2));

      const accDepLedgerId = await resolveAccumulatedDepreciationLedger(asset, t);

      const journalEntries = [
        { ledgerId: asset.depreciationLedgerId, debit: depAmount, credit: 0 },
        { ledgerId: accDepLedgerId, debit: 0, credit: depAmount }
      ];

      const voucher = await AccountingService.recordJournalEntry({
        companyId: asset.CompanyId,
        date: date || new Date(),
        voucherType: 'Journal',
        narration: `Depreciation run (Batch) for ${asset.name}. Value before: ₹${valueBefore.toFixed(2)}, Value after: ₹${valueAfter.toFixed(2)}`,
        entries: journalEntries,
        userId: req.user?.id
      }, t);

      const log = await DepreciationLog.create({
        FixedAssetId: asset.id,
        date: date || new Date(),
        amount: depAmount,
        bookValueBefore: valueBefore,
        bookValueAfter: valueAfter,
        VoucherId: voucher.id,
        CompanyId: asset.CompanyId
      }, { transaction: t });

      await asset.update({
        currentBookValue: valueAfter,
        accumulatedDepreciation: parseFloat((parseFloat(asset.accumulatedDepreciation || 0) + depAmount).toFixed(2))
      }, { transaction: t });

      results.push({ assetId: asset.id, name: asset.name, amount: depAmount, valueAfter });
    }

    if (results.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'No depreciation was posted. All assets might already be fully depreciated.' });
    }

    await t.commit();
    res.status(201).json({ message: 'Batch depreciation posted successfully', count: results.length, details: results });
  } catch (err) {
    if (t) await t.rollback();
    next(err);
  }
};
