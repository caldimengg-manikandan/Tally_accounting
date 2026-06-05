const express = require('express');
const router = express.Router();
const { authorizeRoles } = require('../../middleware/auth.middleware');
const quoteController = require('./quote.controller');
const { verifyToken, tenantAccess } = require('../../middleware/auth.middleware');

router.use(verifyToken, tenantAccess);

router.get('/:companyId',    quoteController.getQuotes);
router.get('/detail/:id',   quoteController.getQuoteById);
router.post('/',             quoteController.createQuote);
router.put('/:id',           quoteController.updateQuote);
router.patch('/:id/status',  quoteController.updateStatus);
router.post('/send-email/:id', quoteController.sendEmail);
router.delete('/:id', authorizeRoles('ADMIN', 'SUPER_ADMIN'),        quoteController.deleteQuote);

module.exports = router;
