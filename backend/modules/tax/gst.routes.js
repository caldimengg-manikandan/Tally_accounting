const express = require('express');
const router = express.Router();
const gstController = require('./gst.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

const ALL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'VIEWER'];

router.use(verifyToken, tenantAccess);

router.get('/gstr1/:companyId', authorizeRoles(...ALL_ROLES), gstController.getGSTR1);
router.get('/gstr2a/:companyId', authorizeRoles(...ALL_ROLES), gstController.getGSTR2A);
router.get('/gstr3b/:companyId', authorizeRoles(...ALL_ROLES), gstController.getGSTR3B);

module.exports = router;
