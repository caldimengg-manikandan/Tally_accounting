const express = require('express');
const router = express.Router();
const fixedAssetsController = require('./fixedAssets.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

const ALL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'VIEWER'];
const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'];

router.use(verifyToken, tenantAccess);

// Assets CRUD
router.get('/:companyId', authorizeRoles(...ALL_ROLES), fixedAssetsController.getAssets);
router.post('/', authorizeRoles(...WRITE_ROLES), fixedAssetsController.createAsset);
router.put('/:id', authorizeRoles(...WRITE_ROLES), fixedAssetsController.updateAsset);
router.delete('/:id', authorizeRoles(...WRITE_ROLES), fixedAssetsController.deleteAsset);

// Operations
router.post('/depreciate/:id', authorizeRoles(...WRITE_ROLES), fixedAssetsController.depreciateAsset);
router.post('/depreciate-batch/:companyId', authorizeRoles(...WRITE_ROLES), fixedAssetsController.depreciateBatch);
router.post('/dispose/:id', authorizeRoles(...WRITE_ROLES), fixedAssetsController.disposeAsset);

module.exports = router;
