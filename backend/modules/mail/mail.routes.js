const express = require('express');
const router = express.Router();
const mailController = require('./mail.controller');
const { verifyToken, tenantAccess } = require('../../middleware/auth.middleware');

router.use(verifyToken, tenantAccess);

// Send Email
router.post('/send', mailController.sendEmail);

// Get History by Ledger (Vendor/Customer)
router.get('/ledger/:ledgerId', mailController.getMailsByLedger);

module.exports = router;
