const { body } = require('express-validator');

const stockInValidation = [
  body('productId')
    .notEmpty().withMessage('Product ID is required.')
    .isInt({ min: 1 }).withMessage('Product ID must be a positive integer.'),
  body('warehouseId')
    .notEmpty().withMessage('Warehouse ID is required.')
    .isInt({ min: 1 }).withMessage('Warehouse ID must be a positive integer.'),
  body('quantity')
    .notEmpty().withMessage('Quantity is required.')
    .isInt({ min: 1 }).withMessage('Quantity must be an integer greater than 0.'),
  body('reference')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Reference cannot exceed 100 characters.'),
  body('reason')
    .trim()
    .notEmpty().withMessage('A valid reason for Stock In is required.')
    .isLength({ min: 3, max: 500 }).withMessage('Reason must be between 3 and 500 characters.')
];

const stockOutValidation = [
  body('productId')
    .notEmpty().withMessage('Product ID is required.')
    .isInt({ min: 1 }).withMessage('Product ID must be a positive integer.'),
  body('warehouseId')
    .notEmpty().withMessage('Warehouse ID is required.')
    .isInt({ min: 1 }).withMessage('Warehouse ID must be a positive integer.'),
  body('quantity')
    .notEmpty().withMessage('Quantity is required.')
    .isInt({ min: 1 }).withMessage('Quantity must be an integer greater than 0.'),
  body('reference')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Reference cannot exceed 100 characters.'),
  body('reason')
    .trim()
    .notEmpty().withMessage('A valid reason for Stock Out is required.')
    .isLength({ min: 3, max: 500 }).withMessage('Reason must be between 3 and 500 characters.')
];

const transferValidation = [
  body('productId')
    .notEmpty().withMessage('Product ID is required.')
    .isInt({ min: 1 }).withMessage('Product ID must be a positive integer.'),
  body('sourceWarehouseId')
    .notEmpty().withMessage('Source Warehouse ID is required.')
    .isInt({ min: 1 }).withMessage('Source Warehouse ID must be a positive integer.'),
  body('destinationWarehouseId')
    .notEmpty().withMessage('Destination Warehouse ID is required.')
    .isInt({ min: 1 }).withMessage('Destination Warehouse ID must be a positive integer.')
    .custom((val, { req }) => {
      if (parseInt(val, 10) === parseInt(req.body.sourceWarehouseId, 10)) {
        throw new Error('Destination warehouse must be different from source warehouse.');
      }
      return true;
    }),
  body('quantity')
    .notEmpty().withMessage('Transfer quantity is required.')
    .isInt({ min: 1 }).withMessage('Transfer quantity must be an integer greater than 0.'),
  body('reference')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Reference cannot exceed 100 characters.'),
  body('reason')
    .trim()
    .notEmpty().withMessage('A valid reason for Transfer is required.')
    .isLength({ min: 3, max: 500 }).withMessage('Reason must be between 3 and 500 characters.')
];

const adjustmentValidation = [
  body('productId')
    .notEmpty().withMessage('Product ID is required.')
    .isInt({ min: 1 }).withMessage('Product ID must be a positive integer.'),
  body('warehouseId')
    .notEmpty().withMessage('Warehouse ID is required.')
    .isInt({ min: 1 }).withMessage('Warehouse ID must be a positive integer.'),
  body('physicalQuantity')
    .notEmpty().withMessage('Physical counted quantity is required.')
    .isInt({ min: 0 }).withMessage('Physical counted quantity cannot be negative.'),
  body('reason')
    .trim()
    .notEmpty().withMessage('Audit reason is mandatory for stock adjustments.')
    .isLength({ min: 5, max: 500 }).withMessage('Adjustment reason must be at least 5 characters explaining the discrepancy.')
];

module.exports = {
  stockInValidation,
  stockOutValidation,
  transferValidation,
  adjustmentValidation
};
