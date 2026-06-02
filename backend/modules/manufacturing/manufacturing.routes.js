const express = require('express');
const router = express.Router();
const manufacturingController = require('./manufacturing.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

const ALL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'VIEWER'];
const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'];

router.use(verifyToken, tenantAccess);

// BOM
router.get('/bom/:companyId', authorizeRoles(...ALL_ROLES), manufacturingController.getBOMs);
router.post('/bom', authorizeRoles(...WRITE_ROLES), manufacturingController.createBOM);
router.delete('/bom/:id', authorizeRoles(...WRITE_ROLES), manufacturingController.deleteBOM);

// Production Orders
router.get('/orders/:companyId', authorizeRoles(...ALL_ROLES), manufacturingController.getProductionOrders);
router.post('/orders', authorizeRoles(...WRITE_ROLES), manufacturingController.createProductionOrder);

module.exports = router;
