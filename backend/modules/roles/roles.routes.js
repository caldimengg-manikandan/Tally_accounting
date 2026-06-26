const express = require('express');
const router = express.Router();
const rolesController = require('./roles.controller');
const { verifyToken, authorizeRoles } = require('../../middleware/auth.middleware');

// All custom roles operations require at least ADMIN privileges
router.use(verifyToken);
router.use(authorizeRoles('SUPER_ADMIN', 'ADMIN'));

// CRUD operations
router.post('/', rolesController.createRole);
router.get('/', rolesController.getRoles);
router.put('/:id', rolesController.updateRole);

module.exports = router;
