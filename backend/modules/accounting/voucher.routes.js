const express = require('express');
const router = express.Router();
const voucherController = require('./voucher.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

// All protected routes require a valid token and active company context
router.use(verifyToken, tenantAccess);

// Create voucher (ACCOUNTANT and ADMIN only)
router.post('/', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN'), voucherController.createVoucher);
router.put('/:id', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN'), voucherController.updateVoucher);
// View vouchers (all roles)
router.get('/:companyId', voucherController.getVouchers);
router.get('/detail/:id', voucherController.getVoucherById);
router.put('/:id/narration', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'DATA_ENTRY'), voucherController.updateVoucherNarration);

module.exports = router;
