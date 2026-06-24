const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const inventoryController = require('./inventory.controller');
const { verifyToken, authorizeRoles, tenantAccess } = require('../../middleware/auth.middleware');

// 🔐 SECURE MULTER CONFIG
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate secure random filename (ignore user-supplied name)
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(8).toString('hex');
    // Extract actual extension safely or default to jpg
    let ext = path.extname(file.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      ext = '.jpg';
    }
    cb(null, `${timestamp}-${randomBytes}${ext}`);
  }
});

// 🔐 MULTER FILE FILTER
const fileFilter = (req, file, cb) => {
  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE // 2 MB max
  }
});

router.use(verifyToken, tenantAccess);

// Upload Item Image (Secure)
router.post('/upload', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      // Pass upload/multer validation errors to global handler
      return next(err);
    }
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // ✅ Use environment variable for base URL (never hardcode)
      const baseUrl = process.env.BACKEND_URL || (process.env.NODE_ENV === 'production' 
                        ? 'https://tally-backend-wfml.onrender.com' 
                        : 'http://127.0.0.1:5000');
      
      const imageUrl = `${baseUrl}/uploads/inventory/${req.file.filename}`;
      res.json({ imageUrl });
    } catch (err) {
      next(err);
    }
  });
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
router.post('/:itemId/adjust', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'), inventoryController.adjustStock);
router.get('/:itemId/history', inventoryController.getItemHistory);
router.delete('/:itemId', authorizeRoles('ACCOUNTANT', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'), inventoryController.deleteItem);

module.exports = router;
