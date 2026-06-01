const express = require('express');
const router = express.Router();
const budgetingController = require('./budgeting.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

const ALL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'VIEWER'];
const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'];

router.use(verifyToken, tenantAccess);

router.get('/:companyId', authorizeRoles(...ALL_ROLES), budgetingController.getBudgets);
router.post('/', authorizeRoles(...WRITE_ROLES), budgetingController.createBudget);
router.delete('/:id', authorizeRoles(...WRITE_ROLES), budgetingController.deleteBudget);
router.get('/variance/:id', authorizeRoles(...ALL_ROLES), budgetingController.getBudgetVariance);

module.exports = router;
