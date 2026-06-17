const { CostCategory, AuditLog } = require('../../models');

exports.createCostCategory = async (req, res, next) => {
  try {
    const { name, description, companyId, CompanyId } = req.body;
    const finalCompanyId = req.companyId || companyId || CompanyId;
    
    const category = await CostCategory.create({
      name,
      description,
      CompanyId: finalCompanyId
    });

    await AuditLog.create({
      action: 'CREATE_COST_CATEGORY',
      tableName: 'CostCategories',
      recordId: category.id,
      newData: category,
      CompanyId: finalCompanyId,
      UserId: req.user?.id
    });

    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
};

exports.getCostCategories = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const categories = await CostCategory.findAll({ where: { CompanyId: companyId } });
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

exports.deleteCostCategory = async (req, res, next) => {
  try {
    const category = await CostCategory.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Cost Category not found' });

    await category.destroy();
    res.json({ message: 'Cost Category deleted successfully' });
  } catch (err) {
    next(err);
  }
};
