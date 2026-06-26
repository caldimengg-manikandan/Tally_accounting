const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const payrollController = require('./payroll.controller');
const salarySlipController = require('./salarySlip.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

const ALL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'VIEWER', 'EMPLOYEE'];
const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'];

// Multer Storage for Employee Photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, 'emp_' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.use(verifyToken, tenantAccess);

// Validation checks
router.post('/employees/validate/email', authorizeRoles(...WRITE_ROLES), payrollController.validateEmail);
router.post('/employees/validate/pan', authorizeRoles(...WRITE_ROLES), payrollController.validatePan);
router.post('/employees/validate/aadhaar', authorizeRoles(...WRITE_ROLES), payrollController.validateAadhaar);

// CSV Import/Export
router.post('/employees/import', authorizeRoles(...WRITE_ROLES), payrollController.importEmployees);
router.get('/employees/export', authorizeRoles(...ALL_ROLES), payrollController.exportEmployees);

// Outgoing PDF profile
router.get('/employees/:id/pdf', authorizeRoles(...ALL_ROLES), payrollController.exportEmployeePDF);

// Photo Upload
router.post('/employees/:id/upload-photo', authorizeRoles(...WRITE_ROLES), upload.single('photo'), payrollController.uploadPhoto);



// Payroll Settings
router.get('/:companyId/settings', authorizeRoles(...ALL_ROLES), payrollController.getSettings);
router.put('/:companyId/settings', authorizeRoles(...WRITE_ROLES), payrollController.saveSettings);
router.post('/settings/test-calculation', authorizeRoles(...ALL_ROLES), payrollController.testCalculation);

// Attendance Log
router.post('/attendance', authorizeRoles(...WRITE_ROLES), payrollController.saveAttendance);
router.get('/attendance/:companyId', authorizeRoles(...ALL_ROLES), payrollController.getAttendanceRange);

// Processing & Payslips
router.post('/process', authorizeRoles(...WRITE_ROLES), payrollController.processPayroll);
router.get('/payslips/:companyId', authorizeRoles(...ALL_ROLES), payrollController.getPayslips);

// Salary Slips (Merged from salarySlip.routes.js)
router.get('/:companyId/employees-selection', authorizeRoles(...ALL_ROLES), salarySlipController.getEmployeesForSelection);
router.post('/:companyId/calculate-single', authorizeRoles(...WRITE_ROLES), salarySlipController.calculateSingleSalary);
router.post('/:companyId/process-month', authorizeRoles(...WRITE_ROLES), salarySlipController.processMonth);
router.get('/slips/detail/:slipId', authorizeRoles(...ALL_ROLES), salarySlipController.getSalarySlipDetails);
router.get('/slips/:slipId/pdf', authorizeRoles(...ALL_ROLES), salarySlipController.exportPayslipPDF);
router.get('/:companyId/slips', authorizeRoles(...ALL_ROLES), salarySlipController.getAllSlipsForMonth);

// Employees CRUD
router.post('/employees', authorizeRoles(...WRITE_ROLES), payrollController.createEmployee);
router.get('/employees/detail/:id', authorizeRoles(...ALL_ROLES), payrollController.getEmployeeById);
router.put('/employees/:id', authorizeRoles(...WRITE_ROLES), payrollController.updateEmployee);
router.post('/employees/:id/reactivate', authorizeRoles(...WRITE_ROLES), payrollController.reactivateEmployee);
router.delete('/employees/:id', authorizeRoles(...WRITE_ROLES), payrollController.deleteEmployee);

// Lists (Both tenant header based and param path based)
router.get('/employees/:companyId', authorizeRoles(...ALL_ROLES), payrollController.getEmployees);
router.get('/employees', authorizeRoles(...ALL_ROLES), payrollController.getEmployees);

module.exports = router;
