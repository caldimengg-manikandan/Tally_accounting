const express = require('express');
const router = express.Router();
const costCategoryController = require('./costCategory.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

const ALL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'VIEWER'];
const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'];

router.use(verifyToken, tenantAccess);

router.get('/:companyId', authorizeRoles(...ALL_ROLES), costCategoryController.getCostCategories);
router.post('/', authorizeRoles(...WRITE_ROLES), costCategoryController.createCostCategory);
router.delete('/:id', authorizeRoles(...WRITE_ROLES), costCategoryController.deleteCostCategory);

module.exports = router;
