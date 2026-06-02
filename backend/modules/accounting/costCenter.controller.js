const { CostCenter, CostCategory, AuditLog } = require('../../models');

exports.createCostCenter = async (req, res) => {
  try {
    const { name, category, description, companyId, costCategoryId } = req.body;
    const costCenter = await CostCenter.create({
      name,
      category: category || 'General',
      description,
      CompanyId: companyId,
      costCategoryId: costCategoryId || null
    });

    await AuditLog.create({
      action: 'CREATE_COST_CENTER',
      tableName: 'CostCenters',
      recordId: costCenter.id,
      newData: costCenter,
      CompanyId: companyId,
      UserId: req.user?.id
    });

    res.status(201).json(costCenter);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCostCenters = async (req, res) => {
  try {
    const { companyId } = req.params;
    const costCenters = await CostCenter.findAll({ 
      where: { CompanyId: companyId },
      include: [{ model: CostCategory, attributes: ['id', 'name'] }]
    });
    res.json(costCenters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCostCenter = async (req, res) => {
  try {
    const costCenter = await CostCenter.findByPk(req.params.id);
    if (!costCenter) return res.status(404).json({ error: 'Cost Center not found' });

    await costCenter.destroy();
    res.json({ message: 'Cost Center deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
