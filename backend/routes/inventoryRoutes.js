const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/inventoryController');
const authenticateToken = require('../middleware/auth');
const requireRole = require('../middleware/checkRole');
const { verifyWarehouseAccess, verifyTransferWarehouseAccess } = require('../middleware/checkWarehouseAccess');
const { ROLES } = require('../utils/constants');
const { 
  stockInValidation, 
  stockOutValidation, 
  transferValidation, 
  adjustmentValidation 
} = require('../validators/inventoryValidators');
const validateRequest = require('../middleware/validator');

router.use(authenticateToken);

// Inventory Table / Matrix
router.get('/', InventoryController.getInventory);

// Stock In (Admin, Manager, Staff with authorized warehouse)
router.post(
  '/stock-in',
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF),
  verifyWarehouseAccess('body', 'warehouseId'),
  stockInValidation,
  validateRequest,
  InventoryController.stockIn
);

// Stock Out (Admin, Manager, Staff with authorized warehouse)
router.post(
  '/stock-out',
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF),
  verifyWarehouseAccess('body', 'warehouseId'),
  stockOutValidation,
  validateRequest,
  InventoryController.stockOut
);

// Stock Transfer (Admin, Manager, Staff with dual-assigned warehouses)
router.post(
  '/transfer',
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF),
  verifyTransferWarehouseAccess(),
  transferValidation,
  validateRequest,
  InventoryController.transfer
);

// Stock Adjustment (Admin, Manager only; Staff is strictly prohibited)
router.post(
  '/adjustment',
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  verifyWarehouseAccess('body', 'warehouseId'),
  adjustmentValidation,
  validateRequest,
  InventoryController.adjustment
);

// Audit Trail / History
router.get('/history', InventoryController.getHistory);

// Stock Alerts (Low Stock & Out of Stock)
router.get('/alerts', InventoryController.getAlerts);

module.exports = router;
