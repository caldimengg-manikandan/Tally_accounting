const express = require('express');
const router = express.Router();
const { authorizeRoles } = require('../../middleware/auth.middleware');
const timesheetController = require('./timesheet.controller');
const { verifyToken, tenantAccess } = require('../../middleware/auth.middleware');

router.use(verifyToken, tenantAccess);

router.post('/', timesheetController.logTime);
router.get('/project/:projectId', timesheetController.getProjectTimesheets);
router.delete('/:id', authorizeRoles('ADMIN', 'SUPER_ADMIN'), timesheetController.deleteTimesheet);

module.exports = router;
