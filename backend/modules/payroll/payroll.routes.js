const express = require('express');
const router = express.Router();
const payrollController = require('./payroll.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

const ALL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'VIEWER'];
const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'];

router.use(verifyToken, tenantAccess);

// Employees CRUD
router.get('/employees/:companyId', authorizeRoles(...ALL_ROLES), payrollController.getEmployees);
router.post('/employees', authorizeRoles(...WRITE_ROLES), payrollController.createEmployee);
router.put('/employees/:id', authorizeRoles(...WRITE_ROLES), payrollController.updateEmployee);
router.delete('/employees/:id', authorizeRoles(...WRITE_ROLES), payrollController.deleteEmployee);

// Salary Structure
router.post('/salary-structure', authorizeRoles(...WRITE_ROLES), payrollController.saveSalaryStructure);

// Attendance Log
router.post('/attendance', authorizeRoles(...WRITE_ROLES), payrollController.saveAttendance);
router.get('/attendance/:companyId', authorizeRoles(...ALL_ROLES), payrollController.getAttendanceRange);

// Processing & Payslips
router.post('/process', authorizeRoles(...WRITE_ROLES), payrollController.processPayroll);
router.get('/payslips/:companyId', authorizeRoles(...ALL_ROLES), payrollController.getPayslips);

module.exports = router;
