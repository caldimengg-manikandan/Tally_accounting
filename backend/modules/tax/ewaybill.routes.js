const express = require('express');
const router = express.Router();
const ewaybillController = require('./ewaybill.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER'];

router.use(verifyToken, tenantAccess);

router.post('/generate/:companyId/:challanId', authorizeRoles(...WRITE_ROLES), ewaybillController.generateEWayBill);
router.post('/cancel/:companyId/:challanId', authorizeRoles(...WRITE_ROLES), ewaybillController.cancelEWayBill);

module.exports = router;
