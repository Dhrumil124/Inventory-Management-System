const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');
const authenticateToken = require('../middleware/auth');
const requireRole = require('../middleware/checkRole');
const { ROLES } = require('../utils/constants');
const { categoryValidation } = require('../validators/catalogValidators');
const validateRequest = require('../middleware/validator');

router.use(authenticateToken);

router.get('/', CategoryController.listCategories);
router.get('/:id', CategoryController.getCategoryById);
router.post('/', requireRole(ROLES.ADMIN), categoryValidation, validateRequest, CategoryController.createCategory);
router.put('/:id', requireRole(ROLES.ADMIN), categoryValidation, validateRequest, CategoryController.updateCategory);
router.delete('/:id', requireRole(ROLES.ADMIN), CategoryController.deleteCategory);

module.exports = router;
