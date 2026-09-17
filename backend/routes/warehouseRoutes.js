const express = require('express');
const router = express.Router();
const WarehouseController = require('../controllers/warehouseController');
const authenticateToken = require('../middleware/auth');
const requireRole = require('../middleware/checkRole');
const { ROLES } = require('../utils/constants');
const { warehouseValidation } = require('../validators/catalogValidators');
const validateRequest = require('../middleware/validator');

router.use(authenticateToken);

router.get('/', WarehouseController.listWarehouses);
router.get('/destinations', WarehouseController.listTransferDestinations);
router.get('/:id', WarehouseController.getWarehouseById);
router.post('/', requireRole(ROLES.ADMIN), warehouseValidation, validateRequest, WarehouseController.createWarehouse);
router.put('/:id', requireRole(ROLES.ADMIN), WarehouseController.updateWarehouse);

module.exports = router;
