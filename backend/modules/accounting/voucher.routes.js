const express = require('express');
const router = express.Router();
const voucherController = require('./voucher.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

// All protected routes require a valid token and active company context
router.use(verifyToken, tenantAccess);

// Create voucher (ACCOUNTANT and ADMIN only)
router.post('/', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN'), voucherController.createVoucher);
// View vouchers (all roles)
router.get('/:companyId', voucherController.getVouchers);
router.get('/detail/:id', voucherController.getVoucherById);

module.exports = router;
