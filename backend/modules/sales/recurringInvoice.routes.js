const express = require('express');
const router = express.Router();
const { authorizeRoles } = require('../../middleware/auth.middleware');
const recurringController = require('./recurringInvoice.controller');
const { verifyToken, tenantAccess } = require('../../middleware/auth.middleware');

router.use(verifyToken, tenantAccess);

router.post('/', recurringController.create);
router.get('/company/:companyId', recurringController.getByCompany);

// ⚠️  Specific named routes MUST come before /:id to avoid Express matching them as id=
router.post('/process-due', recurringController.processDueInvoices);
router.get('/history/:id', recurringController.getHistory);
router.get('/child-invoices/:id', recurringController.getChildInvoices);
router.post('/create-manual/:id', recurringController.createManualInvoice);

// Generic param routes last
router.get('/:id', recurringController.getById);
router.put('/:id', recurringController.update);
router.delete('/:id', authorizeRoles('ADMIN', 'SUPER_ADMIN'), recurringController.delete);

module.exports = router;
