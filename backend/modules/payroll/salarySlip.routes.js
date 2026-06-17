const express = require('express');
const router = express.Router();
const salarySlipController = require('./salarySlip.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

const ALL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'VIEWER', 'EMPLOYEE'];
const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'];

router.use(verifyToken, tenantAccess);

// Step 4: Monthly Salary Processing Endpoints
router.get('/:companyId/employees-selection', authorizeRoles(...ALL_ROLES), salarySlipController.getEmployeesForSelection);
router.post('/:companyId/calculate-single', authorizeRoles(...WRITE_ROLES), salarySlipController.calculateSingleSalary);
router.post('/:companyId/process-month', authorizeRoles(...WRITE_ROLES), salarySlipController.processMonth);

// Retrieve slips
router.get('/slips/detail/:slipId', authorizeRoles(...ALL_ROLES), salarySlipController.getSalarySlipDetails);
router.get('/:companyId/slips', authorizeRoles(...ALL_ROLES), salarySlipController.getAllSlipsForMonth);

module.exports = router;
