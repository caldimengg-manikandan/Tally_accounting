const express = require('express');
const router = express.Router();
const controller = require('./creditNote.controller');
const { verifyToken, tenantAccess } = require('../../middleware/auth.middleware');

router.use(verifyToken, tenantAccess);

router.post('/', controller.createCreditNote);
router.get('/company/:companyId', controller.getCreditNotes);
router.get('/:id', controller.getCreditNoteById);
router.put('/:id', controller.updateCreditNote);
router.delete('/:id', controller.deleteCreditNote);

module.exports = router;
