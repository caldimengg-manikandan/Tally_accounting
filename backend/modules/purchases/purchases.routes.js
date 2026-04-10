const express = require('express');
const router = express.Router();
const purchasesController = require('./purchases.controller');
const { verifyToken, tenantAccess, authorizeRoles } = require('../../middleware/auth.middleware');

router.use(verifyToken, tenantAccess);

// Vendors
router.get('/vendors/:companyId', purchasesController.getVendors);

// Purchase Orders
router.get('/orders/:companyId', purchasesController.getOrders);
router.post('/orders', purchasesController.createOrder);
router.put('/orders/:id', purchasesController.updateOrder);
router.delete('/orders/:id', purchasesController.deleteOrder);

// Bills
router.get('/bills/:companyId', purchasesController.getBills);

// Expenses
router.get('/expenses/:companyId', purchasesController.getExpenses);

module.exports = router;
