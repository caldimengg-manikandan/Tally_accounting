const express = require('express');
const router = express.Router();
const controller = require('./deliveryChallan.controller');

router.post('/', controller.createChallan);
router.get('/company/:companyId', controller.getChallans);
router.get('/:id', controller.getChallanById);
router.put('/:id', controller.updateChallan);
router.delete('/:id', controller.deleteChallan);
router.post('/send-email/:id', controller.sendEmail);

module.exports = router;
