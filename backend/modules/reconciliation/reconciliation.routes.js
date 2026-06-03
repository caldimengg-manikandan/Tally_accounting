const express = require('express');
const router = express.Router();
const reconciliationController = require('./reconciliation.controller');
const { verifyToken, tenantAccess } = require('../../middleware/auth.middleware');

router.use(verifyToken, tenantAccess);

router.post('/import', reconciliationController.importStatement);
router.get('/unmatched/:companyId', reconciliationController.getUnmatched);
router.post('/reconcile', reconciliationController.reconcile);

module.exports = router;
