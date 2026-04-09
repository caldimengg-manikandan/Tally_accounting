const express = require('express');
const router = express.Router();
const recurringController = require('./recurringInvoice.controller');
const { verifyToken, tenantAccess } = require('../../middleware/auth.middleware');

router.use(verifyToken, tenantAccess);

router.post('/', recurringController.create);
router.get('/company/:companyId', recurringController.getByCompany);
router.put('/:id', recurringController.update);
router.delete('/:id', recurringController.delete);
router.post('/process-due', recurringController.processDueInvoices);

module.exports = router;
