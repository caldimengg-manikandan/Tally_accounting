const express = require('express');
const router = express.Router();
const controller = require('./retainerInvoice.controller');
const { verifyToken, tenantAccess } = require('../../middleware/auth.middleware');

router.use(verifyToken, tenantAccess);

router.post('/', controller.create);
router.post('/send-email/:id', controller.sendEmail);
router.get('/view/:id', controller.getById); // Changed from /detail/:id
router.get('/company/:companyId', controller.getByCompany); // Added /company/ prefix
router.put('/:id', controller.update);
router.post('/record-payment/:id', controller.recordPayment);
router.post('/apply-to-invoice/:id', controller.applyToInvoice);
router.delete('/:id', controller.delete);

module.exports = router;
