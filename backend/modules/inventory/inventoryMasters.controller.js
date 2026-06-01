const { StockGroup, StockCategory, UnitOfMeasure, Godown, Item } = require('../../models');

// ─── STOCK GROUPS ─────────────────────────────────────────────────────────────
exports.getStockGroups = async (req, res) => {
  try {
    const { companyId } = req.params;
    const groups = await StockGroup.findAll({
      where: { CompanyId: companyId },
      order: [['name', 'ASC']]
    });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createStockGroup = async (req, res) => {
  try {
    const { name, description, companyId, parent_id } = req.body;
    const group = await StockGroup.create({
      name,
      description,
      CompanyId: companyId,
      parent_id: parent_id || null
    });
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStockGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parent_id } = req.body;
    const group = await StockGroup.findByPk(id);
    if (!group) return res.status(404).json({ error: 'Stock Group not found' });

    await group.update({
      name: name !== undefined ? name : group.name,
      description: description !== undefined ? description : group.description,
      parent_id: parent_id !== undefined ? (parent_id || null) : group.parent_id
    });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteStockGroup = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if items are attached to this group
    const itemCount = await Item.count({ where: { stockGroupId: id } });
    if (itemCount > 0) {
      return res.status(400).json({ error: 'Cannot delete group with existing items.' });
    }
    // Check if sub-groups are attached
    const subGroupCount = await StockGroup.count({ where: { parent_id: id } });
    if (subGroupCount > 0) {
      return res.status(400).json({ error: 'Cannot delete group with existing sub-groups.' });
    }

    await StockGroup.destroy({ where: { id } });
    res.json({ message: 'Stock Group deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── STOCK CATEGORIES ─────────────────────────────────────────────────────────
exports.getStockCategories = async (req, res) => {
  try {
    const { companyId } = req.params;
    const categories = await StockCategory.findAll({
      where: { CompanyId: companyId },
      order: [['name', 'ASC']]
    });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createStockCategory = async (req, res) => {
  try {
    const { name, description, companyId } = req.body;
    const category = await StockCategory.create({
      name,
      description,
      CompanyId: companyId
    });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStockCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const category = await StockCategory.findByPk(id);
    if (!category) return res.status(404).json({ error: 'Stock Category not found' });

    await category.update({
      name: name !== undefined ? name : category.name,
      description: description !== undefined ? description : category.description
    });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteStockCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const itemCount = await Item.count({ where: { stockCategoryId: id } });
    if (itemCount > 0) {
      return res.status(400).json({ error: 'Cannot delete category with existing items.' });
    }

    await StockCategory.destroy({ where: { id } });
    res.json({ message: 'Stock Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── UNITS OF MEASURE ────────────────────────────────────────────────────────
exports.getUnitsOfMeasure = async (req, res) => {
  try {
    const { companyId } = req.params;
    const units = await UnitOfMeasure.findAll({
      where: { CompanyId: companyId },
      order: [['symbol', 'ASC']]
    });
    res.json(units);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createUnitOfMeasure = async (req, res) => {
  try {
    const { symbol, formalName, decimalPlaces, companyId } = req.body;
    const unit = await UnitOfMeasure.create({
      symbol,
      formalName,
      decimalPlaces: decimalPlaces || 0,
      CompanyId: companyId
    });
    res.status(201).json(unit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUnitOfMeasure = async (req, res) => {
  try {
    const { id } = req.params;
    const { symbol, formalName, decimalPlaces } = req.body;
    const unit = await UnitOfMeasure.findByPk(id);
    if (!unit) return res.status(404).json({ error: 'Unit of Measure not found' });

    await unit.update({
      symbol: symbol !== undefined ? symbol : unit.symbol,
      formalName: formalName !== undefined ? formalName : unit.formalName,
      decimalPlaces: decimalPlaces !== undefined ? decimalPlaces : unit.decimalPlaces
    });
    res.json(unit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUnitOfMeasure = async (req, res) => {
  try {
    const { id } = req.params;
    const itemCount = await Item.count({ where: { unitOfMeasureId: id } });
    if (itemCount > 0) {
      return res.status(400).json({ error: 'Cannot delete unit with existing items.' });
    }

    await UnitOfMeasure.destroy({ where: { id } });
    res.json({ message: 'Unit of Measure deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GODOWNS ──────────────────────────────────────────────────────────────────
exports.getGodowns = async (req, res) => {
  try {
    const { companyId } = req.params;
    const godowns = await Godown.findAll({
      where: { CompanyId: companyId },
      order: [['name', 'ASC']]
    });
    res.json(godowns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createGodown = async (req, res) => {
  try {
    const { name, address, companyId } = req.body;
    const godown = await Godown.create({
      name,
      address,
      CompanyId: companyId
    });
    res.status(201).json(godown);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateGodown = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address } = req.body;
    const godown = await Godown.findByPk(id);
    if (!godown) return res.status(404).json({ error: 'Godown not found' });

    await godown.update({
      name: name !== undefined ? name : godown.name,
      address: address !== undefined ? address : godown.address
    });
    res.json(godown);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteGodown = async (req, res) => {
  try {
    const { id } = req.params;
    const itemCount = await Item.count({ where: { godownId: id } });
    if (itemCount > 0) {
      return res.status(400).json({ error: 'Cannot delete godown with existing items.' });
    }

    await Godown.destroy({ where: { id } });
    res.json({ message: 'Godown deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
