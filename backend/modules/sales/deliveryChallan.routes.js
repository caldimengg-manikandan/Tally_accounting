const express = require('express');
const router = express.Router();
const { authorizeRoles } = require('../../middleware/auth.middleware');
const controller = require('./deliveryChallan.controller');
const { verifyToken, tenantAccess } = require('../../middleware/auth.middleware');

router.use(verifyToken, tenantAccess);

router.post('/', controller.createChallan);
router.get('/company/:companyId', controller.getChallans);
router.get('/:id', controller.getChallanById);
router.put('/:id', controller.updateChallan);
router.delete('/:id', authorizeRoles('ADMIN', 'SUPER_ADMIN'), controller.deleteChallan);
router.post('/send-email/:id', controller.sendEmail);

module.exports = router;
