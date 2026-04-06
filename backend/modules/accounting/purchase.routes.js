const express = require('express');
const router = express.Router();
const c = require('./purchase.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

router.use(verifyToken, tenantAccess);

// All roles can view purchase orders
router.get('/:companyId', c.getPurchaseOrders);
// Create/Edit — ACCOUNTANT and above
router.post('/', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN'), c.createPurchaseOrder);
router.put('/:id', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN'), c.updatePurchaseOrder);
// Delete — ADMIN only
router.delete('/:id', authorizeRoles('ADMIN', 'SUPER_ADMIN'), c.deletePurchaseOrder);

module.exports = router;
