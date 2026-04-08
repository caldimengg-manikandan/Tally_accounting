const express = require('express');
const router = express.Router();
const pricelistController = require('./pricelist.controller');
const { verifyToken, tenantAccess } = require('../../middleware/auth.middleware');

// Apply common middleware
router.use(verifyToken, tenantAccess);

// CRUD Routes
router.post('/', pricelistController.createPriceList);
router.get('/:companyId', pricelistController.getPriceLists);
router.get('/detail/:id', pricelistController.getPriceListById);
router.put('/:id', pricelistController.updatePriceList);
router.delete('/:id', pricelistController.deletePriceList);

module.exports = router;
