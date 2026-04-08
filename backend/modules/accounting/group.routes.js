const express = require('express');
const router = express.Router();
const groupController = require('./group.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

router.use(verifyToken, tenantAccess);

// Read — all roles
router.get('/resolve', groupController.resolveCompanyGroups);
router.get('/:companyId', groupController.getGroups);

// Write — ACCOUNTANT and above
router.post('/', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN'), groupController.createGroup);
router.post('/seed/:companyId', groupController.seedGroups);
router.put('/:id', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN'), groupController.updateGroup);
router.delete('/:id', authorizeRoles('ADMIN', 'SUPER_ADMIN'), groupController.deleteGroup);

module.exports = router;
