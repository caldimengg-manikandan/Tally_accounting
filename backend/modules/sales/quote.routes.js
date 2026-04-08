const express = require('express');
const router = express.Router();
const quoteController = require('./quote.controller');
const { verifyToken, tenantAccess } = require('../../middleware/auth.middleware');

router.use(verifyToken, tenantAccess);

router.get('/:companyId',    quoteController.getQuotes);
router.get('/detail/:id',   quoteController.getQuoteById);
router.post('/',             quoteController.createQuote);
router.put('/:id',           quoteController.updateQuote);
router.patch('/:id/status',  quoteController.updateStatus);
router.delete('/:id',        quoteController.deleteQuote);

module.exports = router;
