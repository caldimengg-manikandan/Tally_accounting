const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

// ── Public route: verify email change token (opened from email link in browser) ──
router.get('/verify-email', usersController.verifyEmailChange);

// ── Authenticated route: any logged-in user can request an email change for themselves ──
router.post('/request-email-change', verifyToken, usersController.requestEmailChange);

// All remaining user management routes require ADMIN or SUPER_ADMIN
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
