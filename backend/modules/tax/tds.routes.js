const express = require('express');
const router = express.Router();
const tdsController = require('./tds.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

const ALL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'VIEWER'];

router.use(verifyToken, tenantAccess);

router.get('/form-26q/:companyId', authorizeRoles(...ALL_ROLES), tdsController.getForm26Q);

module.exports = router;
