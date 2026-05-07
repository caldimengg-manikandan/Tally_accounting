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

// View orders & invoices — all roles
router.get('/orders/:companyId', salesController.getOrders);
router.get('/invoices/company/:companyId', salesController.getInvoicesByCompany);
router.get('/invoices/detail/:id', salesController.getInvoiceById);

// Update invoices — MANAGER can approve/update, ACCOUNTANT can edit
router.put('/invoices/:id', authorizeRoles('ACCOUNTANT', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'), salesController.updateInvoice);

router.delete('/orders/:orderId', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN'), salesController.deleteOrder);
router.delete('/invoices/:id', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN'), salesController.deleteInvoice);
// New Payment & Credit Application Routes
router.get('/invoices/open/:customerId', salesController.getOpenInvoices);
router.post('/payments/record', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN'), salesController.recordPayment);
router.post('/credits/apply', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN'), salesController.applyCredit);

module.exports = router;
