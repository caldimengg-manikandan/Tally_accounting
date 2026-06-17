const express = require('express');
const router = express.Router();
const salaryController = require('./salary.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

const ALL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'VIEWER', 'EMPLOYEE'];
const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER'];

router.use(verifyToken, tenantAccess);

// ─── Component Endpoints ─────────────────────────────────────
router.get('/components', authorizeRoles(...ALL_ROLES), salaryController.getComponents);
router.post('/components', authorizeRoles(...WRITE_ROLES), salaryController.createComponent);
router.put('/components/:id', authorizeRoles(...WRITE_ROLES), salaryController.updateComponent);
router.delete('/components/:id', authorizeRoles(...WRITE_ROLES), salaryController.deleteComponent);

// ─── Structure Endpoints ─────────────────────────────────────
router.get('/structures', authorizeRoles(...ALL_ROLES), salaryController.getStructures);
router.get('/structures/:id', authorizeRoles(...ALL_ROLES), salaryController.getStructureById);
router.post('/structures', authorizeRoles(...WRITE_ROLES), salaryController.createStructure);
router.put('/structures/:id', authorizeRoles(...WRITE_ROLES), salaryController.updateStructure);
router.delete('/structures/:id', authorizeRoles(...WRITE_ROLES), salaryController.deleteStructure);

// ─── Assignment Endpoints ────────────────────────────────────
router.get('/assignments', authorizeRoles(...ALL_ROLES), salaryController.getAssignments);
router.get('/assignments/employee/:employeeId', authorizeRoles(...ALL_ROLES), salaryController.getEmployeeAssignmentDetails);
router.post('/assignments', authorizeRoles(...WRITE_ROLES), salaryController.assignSalary);
router.delete('/assignments/:id', authorizeRoles(...WRITE_ROLES), salaryController.removeAssignment);

// ─── Preview Calculation Endpoint ────────────────────────────
router.post('/calculate-preview', authorizeRoles(...ALL_ROLES), salaryController.calculatePreview);

module.exports = router;
