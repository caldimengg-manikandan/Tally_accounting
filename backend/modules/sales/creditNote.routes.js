const express = require('express');
const router = express.Router();
const { authorizeRoles } = require('../../middleware/auth.middleware');
const controller = require('./creditNote.controller');
const { verifyToken, tenantAccess } = require('../../middleware/auth.middleware');

router.use(verifyToken, tenantAccess);

router.post('/', controller.createCreditNote);
router.get('/company/:companyId', controller.getCreditNotes);
router.get('/:id', controller.getCreditNoteById);
router.put('/:id', controller.updateCreditNote);
router.delete('/:id', authorizeRoles('ADMIN', 'SUPER_ADMIN'), controller.deleteCreditNote);

module.exports = router;
