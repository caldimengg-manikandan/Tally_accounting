const express = require('express');
const router = express.Router();
const controller = require('./support.controller');
const { tenantAccess, verifyToken } = require('../../middleware/auth.middleware');

// Company-level routes (User submitting tickets)
router.post('/', verifyToken, tenantAccess, controller.createTicket);
router.get('/', verifyToken, tenantAccess, controller.getCompanyTickets);

// Admin-level routes (Super Admin managing all tickets)
// Note: In production, add verifySuperAdmin middleware here
router.get('/admin', verifyToken, controller.getAllTicketsAdmin);
router.put('/admin/:ticketId', verifyToken, controller.replyToTicket);

module.exports = router;
