const express = require('express');
const router = express.Router();
const voucherController = require('./voucher.controller');
const { verifyToken, authorizeRoles, tenantAccess, guardLockedVoucher, trackModifiers } = require('../../middleware/auth.middleware');

// All protected routes require a valid token and active company context
router.use(verifyToken, tenantAccess);

// Bulk Update transactions
router.post('/bulk-update', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN'), voucherController.bulkUpdateTransactions);

// Create voucher
router.post('/', trackModifiers, authorizeRoles('EMPLOYEE', 'ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN'), voucherController.createVoucher);
router.put('/:id', guardLockedVoucher, trackModifiers, authorizeRoles('EMPLOYEE', 'ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN'), voucherController.updateVoucher);
router.delete('/:id', guardLockedVoucher, authorizeRoles('ADMIN', 'SUPER_ADMIN'), voucherController.deleteVoucher);

// Approval & Cancellation routes (ADMIN only)
router.put('/:id/approve', authorizeRoles('ADMIN', 'SUPER_ADMIN'), voucherController.approveVoucher);
router.put('/:id/cancel', authorizeRoles('ADMIN', 'SUPER_ADMIN'), voucherController.cancelVoucher);

// View vouchers (all roles)
router.get('/transactions/:companyId', voucherController.getTransactions);
router.get('/:companyId', voucherController.getVouchers);
router.get('/detail/:id', voucherController.getVoucherById);
router.put('/:id/narration', guardLockedVoucher, authorizeRoles('EMPLOYEE', 'ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'DATA_ENTRY'), voucherController.updateVoucherNarration);

module.exports = router;
