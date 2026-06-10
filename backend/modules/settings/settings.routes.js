const express = require('express');
const router = express.Router();
const settingsController = require('./settings.controller');
const { verifyToken, tenantAccess, authorizeRoles } = require('../../middleware/auth.middleware');

router.use(verifyToken);
router.use(tenantAccess);

// Only ADMIN or SUPER_ADMIN should manage financial periods
router.post('/financial-periods', authorizeRoles('ADMIN', 'SUPER_ADMIN'), settingsController.createFinancialPeriod);
router.get('/financial-periods', authorizeRoles('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), settingsController.getFinancialPeriods);
router.patch('/financial-periods/:id/lock', authorizeRoles('ADMIN', 'SUPER_ADMIN'), settingsController.togglePeriodLock);

module.exports = router;
