const express = require('express');
const router = express.Router();
const currencyController = require('./currency.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

const ALL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'VIEWER'];
const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'];

router.use(verifyToken, tenantAccess);

router.get('/:companyId', authorizeRoles(...ALL_ROLES), currencyController.getCurrencies);
router.post('/', authorizeRoles(...WRITE_ROLES), currencyController.createCurrency);
router.put('/:id', authorizeRoles(...WRITE_ROLES), currencyController.updateCurrency);
router.delete('/:id', authorizeRoles(...WRITE_ROLES), currencyController.deleteCurrency);

module.exports = router;
