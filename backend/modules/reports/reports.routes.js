const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

const ALL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'VIEWER'];
const AUDIT_ROLES = ['SUPER_ADMIN', 'ADMIN', 'AUDITOR'];

// All roles can view reports (tenant scoped)
router.use(verifyToken, tenantAccess);

router.get('/trial-balance/:companyId', authorizeRoles(...ALL_ROLES), reportsController.getTrialBalance);
router.get('/profit-loss/:companyId', authorizeRoles(...ALL_ROLES), reportsController.getProfitAndLoss);
router.get('/balance-sheet/:companyId', authorizeRoles(...ALL_ROLES), reportsController.getBalanceSheet);
router.get('/daybook/:companyId', authorizeRoles(...ALL_ROLES), reportsController.getDaybook);
router.get('/dashboard/:companyId', authorizeRoles(...ALL_ROLES), reportsController.getDashboardStats);
router.get('/ledger-statement/:ledgerId', authorizeRoles(...ALL_ROLES), reportsController.getLedgerStatement);
router.get('/cash-flow/:companyId', authorizeRoles(...ALL_ROLES), reportsController.getCashFlow);
router.get('/receivables-report/:companyId', authorizeRoles(...ALL_ROLES), reportsController.getReceivablesReport);
router.get('/payables-report/:companyId', authorizeRoles(...ALL_ROLES), reportsController.getPayablesReport);
router.get('/inventory-report/:companyId', authorizeRoles(...ALL_ROLES), reportsController.getInventoryReport);
router.get('/group-summary/:companyId', authorizeRoles(...ALL_ROLES), reportsController.getGroupSummary);
router.get('/stock-aging/:companyId', authorizeRoles(...ALL_ROLES), reportsController.getStockAging);
router.get('/cost-centers/:companyId', authorizeRoles(...ALL_ROLES), reportsController.getCostCenterReport);
// Audit logs are restricted to privileged roles
router.get('/audit/:companyId', authorizeRoles(...AUDIT_ROLES), reportsController.getAuditLogs);

module.exports = router;
