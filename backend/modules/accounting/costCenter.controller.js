const { CostCenter, CostCategory, AuditLog } = require('../../models');

exports.createCostCenter = async (req, res, next) => {
  try {
    const { name, category, description, companyId, CompanyId, costCategoryId, parentCostCenterId } = req.body;
    const finalCompanyId = req.companyId || companyId || CompanyId;
    
    const costCenter = await CostCenter.create({
      name,
      category: category || 'General',
      description,
      CompanyId: finalCompanyId,
      costCategoryId: costCategoryId || null,
      parentCostCenterId: parentCostCenterId || null
    });

    await AuditLog.create({
      action: 'CREATE_COST_CENTER',
      tableName: 'CostCenters',
      recordId: costCenter.id,
      newData: costCenter,
      CompanyId: finalCompanyId,
      UserId: req.user?.id
    });

    res.status(201).json(costCenter);
  } catch (err) {
    next(err);
  }
};

exports.getCostCenters = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const costCenters = await CostCenter.findAll({ 
      where: { CompanyId: companyId },
      include: [
        { model: CostCategory, attributes: ['id', 'name'] },
        { model: CostCenter, as: 'ParentCostCenter', attributes: ['id', 'name'] }
      ]
    });
    res.json(costCenters);
  } catch (err) {
    next(err);
  }
};

exports.updateCostCenter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, description, costCategoryId, parentCostCenterId } = req.body;
    
    const costCenter = await CostCenter.findByPk(id);
    if (!costCenter) return res.status(404).json({ error: 'Cost Center not found' });

    await costCenter.update({
      name,
      category: category || costCenter.category,
      description,
      costCategoryId: costCategoryId === undefined ? costCenter.costCategoryId : costCategoryId,
      parentCostCenterId: parentCostCenterId === undefined ? costCenter.parentCostCenterId : parentCostCenterId
    });

    await AuditLog.create({
      action: 'UPDATE_COST_CENTER',
      tableName: 'CostCenters',
      recordId: costCenter.id,
      newData: costCenter,
      CompanyId: costCenter.CompanyId,
      UserId: req.user?.id
    });

    res.json(costCenter);
  } catch (err) {
    next(err);
  }
};

exports.deleteCostCenter = async (req, res, next) => {
  try {
    const costCenter = await CostCenter.findByPk(req.params.id);
    if (!costCenter) return res.status(404).json({ error: 'Cost Center not found' });

    await costCenter.destroy(); // Soft delete because of paranoid: true
    
    await AuditLog.create({
      action: 'DELETE_COST_CENTER',
      tableName: 'CostCenters',
      recordId: costCenter.id,
      CompanyId: costCenter.CompanyId,
      UserId: req.user?.id
    });

    res.json({ message: 'Cost Center deleted successfully' });
  } catch (err) {
    next(err);
  }
};

