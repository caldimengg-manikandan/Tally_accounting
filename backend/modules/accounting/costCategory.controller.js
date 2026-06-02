const { CostCategory, AuditLog } = require('../../models');

exports.createCostCategory = async (req, res) => {
  try {
    const { name, description, companyId } = req.body;
    const category = await CostCategory.create({
      name,
      description,
      CompanyId: companyId
    });

    await AuditLog.create({
      action: 'CREATE_COST_CATEGORY',
      tableName: 'CostCategories',
      recordId: category.id,
      newData: category,
      CompanyId: companyId,
      UserId: req.user?.id
    });

    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCostCategories = async (req, res) => {
  try {
    const { companyId } = req.params;
    const categories = await CostCategory.findAll({ where: { CompanyId: companyId } });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCostCategory = async (req, res) => {
  try {
    const category = await CostCategory.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Cost Category not found' });

    await category.destroy();
    res.json({ message: 'Cost Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
