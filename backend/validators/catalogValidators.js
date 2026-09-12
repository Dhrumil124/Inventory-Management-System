const { body } = require('express-validator');

// Product validators
const createProductValidation = [
  body('sku')
    .trim()
    .notEmpty().withMessage('SKU is required.')
    .isLength({ min: 3, max: 50 }).withMessage('SKU must be between 3 and 50 characters.')
    .matches(/^[A-Za-z0-9\-_]+$/).withMessage('SKU may only contain letters, numbers, hyphens, and underscores.'),
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required.')
    .isLength({ min: 2, max: 150 }).withMessage('Product name must be between 2 and 150 characters.'),
  body('categoryId')
    .notEmpty().withMessage('Category is required.')
    .isInt({ min: 1 }).withMessage('Valid Category ID is required.'),
  body('unit')
    .trim()
    .notEmpty().withMessage('Unit of measurement is required.')
    .isLength({ max: 30 }).withMessage('Unit cannot exceed 30 characters.'),
  body('price')
    .notEmpty().withMessage('Price is required.')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number or zero.'),
  body('minimumStock')
    .notEmpty().withMessage('Minimum stock threshold is required.')
    .isInt({ min: 0 }).withMessage('Minimum stock threshold must be an integer zero or greater.'),
  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters.')
];

const updateProductValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 }).withMessage('Product name must be between 2 and 150 characters.'),
  body('categoryId')
    .optional()
    .isInt({ min: 1 }).withMessage('Valid Category ID is required.'),
  body('unit')
    .optional()
    .trim()
    .isLength({ max: 30 }).withMessage('Unit cannot exceed 30 characters.'),
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a positive number or zero.'),
  body('minimumStock')
    .optional()
    .isInt({ min: 0 }).withMessage('Minimum stock threshold must be an integer zero or greater.'),
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE']).withMessage('Status must be ACTIVE or INACTIVE.')
];

// Category validators
const categoryValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Category name must be between 2 and 100 characters.'),
  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters.')
];

// Warehouse validators
const warehouseValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Warehouse name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Warehouse name must be between 2 and 100 characters.'),
  body('code')
    .trim()
    .notEmpty().withMessage('Warehouse code is required.')
    .isLength({ min: 2, max: 30 }).withMessage('Warehouse code must be between 2 and 30 characters.')
    .matches(/^[A-Za-z0-9\-_]+$/).withMessage('Warehouse code may only contain letters, numbers, hyphens, and underscores.'),
  body('address')
    .trim()
    .notEmpty().withMessage('Address is required.'),
  body('city')
    .trim()
    .notEmpty().withMessage('City is required.'),
  body('state')
    .trim()
    .notEmpty().withMessage('State is required.'),
  body('country')
    .optional()
    .trim(),
  body('pincode')
    .trim()
    .notEmpty().withMessage('Pincode / Postal code is required.'),
  body('contactPerson')
    .optional({ checkFalsy: true })
    .trim(),
  body('phone')
    .optional({ checkFalsy: true })
    .trim(),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Please provide a valid warehouse email.')
];

module.exports = {
  createProductValidation,
  updateProductValidation,
  categoryValidation,
  warehouseValidation
};
