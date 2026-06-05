const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

// All user management routes require a valid token, an active company, and ADMIN role
router.use(verifyToken, tenantAccess, authorizeRoles('ADMIN', 'SUPER_ADMIN'));

// List all users in the current company
router.get('/', usersController.getCompanyUsers);

// Invite / create a new user in the current company
router.post('/invite', usersController.inviteUser);

// Update role of a user within the current company
router.put('/:userId/role', usersController.updateUserRole);

// Remove a user from the current company
router.delete('/:userId', authorizeRoles('ADMIN', 'SUPER_ADMIN'), usersController.removeUser);

module.exports = router;
