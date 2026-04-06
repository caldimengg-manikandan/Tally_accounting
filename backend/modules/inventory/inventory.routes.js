const express = require('express');
const router = express.Router();
const inventoryController = require('./inventory.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

router.use(verifyToken, tenantAccess);

// View items — all roles
router.get('/:companyId', inventoryController.getItems);

// Create/update stock — ACCOUNTANT and above
router.post('/', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN'), inventoryController.createItem);
router.post('/stock/:itemId', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN'), inventoryController.updateStock);

module.exports = router;
