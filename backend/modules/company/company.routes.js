const express = require('express');
const router = express.Router();
const companyController = require('./company.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

// All company routes require authentication
router.use(verifyToken);

// Create a new company (any authenticated user can create one)
router.post('/', companyController.createCompany);
// List companies the user belongs to
router.get('/', companyController.getCompanies);
// Get a specific company (must belong to it)
router.get('/:id', tenantAccess, companyController.getCompanyById);
// Seed groups for a company
router.post('/:id/seed-groups', tenantAccess, companyController.seedGroupsForCompany);
// Sync default ledgers for a company
router.post('/:id/sync-default-ledgers', tenantAccess, companyController.syncDefaultLedgers);
// Update company info (ADMIN only)
router.put('/:id', authorizeRoles('ADMIN', 'SUPER_ADMIN'), tenantAccess, companyController.updateCompany);
// Close financial year (ADMIN only)
router.post('/close-year/:id', authorizeRoles('ADMIN', 'SUPER_ADMIN'), tenantAccess, companyController.closeFinancialYear);
// Delete company (ADMIN/SUPER_ADMIN only)
router.delete('/:id', authorizeRoles('ADMIN', 'SUPER_ADMIN'), tenantAccess, companyController.deleteCompany);

module.exports = router;

