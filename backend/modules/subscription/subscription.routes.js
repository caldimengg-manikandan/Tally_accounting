const express = require('express');
const router = express.Router();
const controller = require('./subscription.controller');
const { verifyToken, tenantAccess } = require('../../middleware/auth.middleware');

// Route to initialize payment (requires auth and company access)
router.post('/create-order', verifyToken, tenantAccess, controller.createSubscriptionOrder);

// Webhook route (must be public so Razorpay can reach it, security is handled by the HMAC signature)
router.post('/webhook', controller.verifyPaymentWebhook);

module.exports = router;
