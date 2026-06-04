const express = require('express');
const router = express.Router();
const costCenterController = require('./costCenter.controller');
const { verifyToken, tenantAccess, authorizeRoles } = require('../../middleware/auth.middleware');

// All Cost Center operations restricted to ACCOUNTANT or higher within the tenant
router.post('/', verifyToken, tenantAccess, authorizeRoles('ADMIN', 'ACCOUNTANT', 'MANAGER'), costCenterController.createCostCenter);
router.get('/:companyId', verifyToken, tenantAccess, costCenterController.getCostCenters);
router.put('/:id', verifyToken, tenantAccess, authorizeRoles('ADMIN', 'ACCOUNTANT'), costCenterController.updateCostCenter);
router.delete('/:id', verifyToken, tenantAccess, authorizeRoles('ADMIN', 'ACCOUNTANT'), costCenterController.deleteCostCenter);


module.exports = router;
