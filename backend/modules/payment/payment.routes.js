const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { verifyToken, tenantAccess } = require('../../middleware/auth.middleware');

// ⚠️ Public webhook endpoint - Signature verified inside controller
router.post('/webhook/razorpay', paymentController.webhookRazorpay);

// Authenticated tenant routes
router.use(verifyToken, tenantAccess);

router.get('/gateways', paymentController.getGateways);
router.post('/gateways', paymentController.saveGateway);
router.put('/gateways/:id/status', paymentController.updateGatewayStatus);
router.post('/gateways/test', paymentController.testConnection);
router.post('/invoices/:id/link', paymentController.generateLink);
router.get('/invoices/:id/transactions', paymentController.getInvoiceTransactions);
router.post('/settlements/reconcile', paymentController.recordSettlement);
router.get('/settlements/unsettled', paymentController.getUnsettledTransactions);

module.exports = router;
