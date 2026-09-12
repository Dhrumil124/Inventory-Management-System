const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authenticateToken = require('../middleware/auth');
const requireRole = require('../middleware/checkRole');
const { ROLES } = require('../utils/constants');
const { createUserValidation, updateUserValidation, warehouseAssignmentValidation } = require('../validators/userValidators');
const validateRequest = require('../middleware/validator');

// All user management routes require ADMIN privileges
router.use(authenticateToken);
router.use(requireRole(ROLES.ADMIN));

router.get('/', UserController.listUsers);
router.get('/:id', UserController.getUserById);
router.post('/', createUserValidation, validateRequest, UserController.createUser);
router.put('/:id', updateUserValidation, validateRequest, UserController.updateUser);
router.post('/:id/warehouses', warehouseAssignmentValidation, validateRequest, UserController.assignWarehouse);
router.delete('/:id/warehouses/:warehouseId', UserController.revokeWarehouse);

module.exports = router;
