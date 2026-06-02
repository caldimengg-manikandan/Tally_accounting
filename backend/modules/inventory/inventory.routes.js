const express = require('express');

const router = express.Router();
const multer = require('multer');
const path = require('path');
const inventoryController = require('./inventory.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

// Multer Storage Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.use(verifyToken, tenantAccess);

// Upload Item Image
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

const mastersController = require('./inventoryMasters.controller');

// Stock Groups
router.get('/groups/:companyId', mastersController.getStockGroups);
router.post('/groups', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'), mastersController.createStockGroup);
router.put('/groups/:id', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'), mastersController.updateStockGroup);
router.delete('/groups/:id', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'), mastersController.deleteStockGroup);

// Stock Categories
router.get('/categories/:companyId', mastersController.getStockCategories);
router.post('/categories', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'), mastersController.createStockCategory);
router.put('/categories/:id', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'), mastersController.updateStockCategory);
router.delete('/categories/:id', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'), mastersController.deleteStockCategory);

// Units of Measure
router.get('/units/:companyId', mastersController.getUnitsOfMeasure);
router.post('/units', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'), mastersController.createUnitOfMeasure);
router.put('/units/:id', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'), mastersController.updateUnitOfMeasure);
router.delete('/units/:id', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'), mastersController.deleteUnitOfMeasure);

// Godowns
router.get('/godowns/:companyId', mastersController.getGodowns);
router.post('/godowns', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'), mastersController.createGodown);
router.put('/godowns/:id', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'), mastersController.updateGodown);
router.delete('/godowns/:id', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'), mastersController.deleteGodown);

// View items — all roles
router.get('/:companyId', inventoryController.getItems);

// Create item — all authenticated users for testing
router.post('/', inventoryController.createItem);
router.put('/:itemId', inventoryController.updateItem);
router.post('/stock/:itemId', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'), inventoryController.updateStock);
router.get('/:itemId/history', inventoryController.getItemHistory);
router.delete('/:itemId', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'), inventoryController.deleteItem);

module.exports = router;
