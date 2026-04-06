const express = require('express');
const router = express.Router();
const salesController = require('./sales.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

router.use(verifyToken, tenantAccess);

// Create orders & invoices — ACCOUNTANT and above
router.post('/orders', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN'), salesController.createOrder);
router.post('/invoices', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN'), salesController.createInvoice);

// Update orders — MANAGER can approve/update, ACCOUNTANT can edit
router.put('/orders/:orderId', authorizeRoles('ACCOUNTANT', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'), salesController.updateOrder);

// View orders — all roles
router.get('/orders/:companyId', salesController.getOrders);

module.exports = router;
