const express = require('express');
const router = express.Router();
const timesheetController = require('./timesheet.controller');
const { verifyToken, tenantAccess } = require('../../middleware/auth.middleware');

router.use(verifyToken, tenantAccess);

router.post('/', timesheetController.logTime);
router.get('/project/:projectId', timesheetController.getProjectTimesheets);
router.delete('/:id', timesheetController.deleteTimesheet);

module.exports = router;
