const express = require('express');
const router = express.Router();
const attendanceController = require('./attendance.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

const ALL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'VIEWER', 'EMPLOYEE'];
const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER'];
const APPROVE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];

router.use(verifyToken, tenantAccess);

// ─── Special routes (must come before :id) ───────────────────
// Monthly summary
router.get('/summary/monthly', authorizeRoles(...ALL_ROLES), attendanceController.getMonthlySummary);
// Export CSV
router.get('/export', authorizeRoles(...ALL_ROLES), attendanceController.exportCSV);
// Bulk import
router.post('/bulk-import', authorizeRoles(...WRITE_ROLES), attendanceController.bulkImport);

// ─── Standard CRUD ────────────────────────────────────────────
router.get('/', authorizeRoles(...ALL_ROLES), attendanceController.getAll);
router.get('/:id', authorizeRoles(...ALL_ROLES), attendanceController.getById);
router.post('/', authorizeRoles(...WRITE_ROLES), attendanceController.create);
router.put('/:id', authorizeRoles(...WRITE_ROLES), attendanceController.update);
router.delete('/:id', authorizeRoles(...WRITE_ROLES), attendanceController.remove);

// ─── Approval ────────────────────────────────────────────────
router.put('/:id/approve', authorizeRoles(...APPROVE_ROLES), attendanceController.approve);

module.exports = router;
