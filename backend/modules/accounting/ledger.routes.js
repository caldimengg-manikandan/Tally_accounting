const express = require('express');
const router = express.Router();
const ledgerController = require('./ledger.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

router.use(verifyToken, tenantAccess);

// Read — all roles
router.get('/:companyId', ledgerController.getLedgers);
router.get('/balance/:id', ledgerController.getLedgerBalance);
router.get('/transactions/:id', ledgerController.getLedgerTransactions);

// Write — ACCOUNTANT, MANAGER and above
router.post('/', authorizeRoles('MANAGER', 'ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN'), ledgerController.createLedger);
router.put('/:id', authorizeRoles('MANAGER', 'ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN'), ledgerController.updateLedger);
router.delete('/:id', authorizeRoles('ADMIN', 'SUPER_ADMIN'), ledgerController.deleteLedger);

module.exports = router;
