const express = require('express');
const router = express.Router();
const projectController = require('./project.controller');
const { verifyToken, tenantAccess } = require('../../middleware/auth.middleware');

router.use(verifyToken, tenantAccess);

router.post('/', projectController.createProject);
router.get('/:companyId', projectController.getProjectsByCompany);
router.get('/detail/:id', projectController.getProjectById);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);
router.get('/:id/purchases', projectController.getProjectPurchases);
router.get('/:id/sales', projectController.getProjectSales);
router.get('/:id/activity', projectController.getProjectActivity);

module.exports = router;
