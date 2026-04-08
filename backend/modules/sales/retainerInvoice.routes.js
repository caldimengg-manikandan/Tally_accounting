const express = require('express');
const router = express.Router();
const controller = require('./retainerInvoice.controller');

router.post('/', controller.create);
router.post('/send-email/:id', controller.sendEmail);
router.get('/view/:id', controller.getById); // Changed from /detail/:id
router.get('/company/:companyId', controller.getByCompany); // Added /company/ prefix
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
