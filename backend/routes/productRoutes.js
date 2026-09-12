const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const authenticateToken = require('../middleware/auth');
const requireRole = require('../middleware/checkRole');
const { ROLES } = require('../utils/constants');
const { createProductValidation, updateProductValidation } = require('../validators/catalogValidators');
const validateRequest = require('../middleware/validator');

router.use(authenticateToken);

router.get('/', ProductController.listProducts);
router.get('/:id', ProductController.getProductById);
router.post('/', requireRole(ROLES.ADMIN), createProductValidation, validateRequest, ProductController.createProduct);
router.put('/:id', requireRole(ROLES.ADMIN), updateProductValidation, validateRequest, ProductController.updateProduct);

module.exports = router;
