const { body } = require('express-validator');

const createUserValidation = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required.')
    .isLength({ min: 2, max: 60 }).withMessage('First name must be between 2 and 60 characters.'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required.')
    .isLength({ min: 2, max: 60 }).withMessage('Last name must be between 2 and 60 characters.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Valid email address is required.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
  body('roleId')
    .notEmpty().withMessage('Role ID is required.')
    .isInt({ min: 1, max: 3 }).withMessage('Role ID must be 1 (ADMIN), 2 (MANAGER), or 3 (STAFF).'),
  body('warehouseIds')
    .optional()
    .isArray().withMessage('warehouseIds must be an array of IDs.')
];

const updateUserValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 }).withMessage('First name must be between 2 and 60 characters.'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 }).withMessage('Last name must be between 2 and 60 characters.'),
  body('roleId')
    .optional()
    .isInt({ min: 1, max: 3 }).withMessage('Role ID must be 1 (ADMIN), 2 (MANAGER), or 3 (STAFF).'),
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE']).withMessage('Status must be ACTIVE or INACTIVE.')
];

const warehouseAssignmentValidation = [
  body('warehouseId')
    .notEmpty().withMessage('Warehouse ID is required.')
    .isInt({ min: 1 }).withMessage('Valid Warehouse ID is required.')
];

module.exports = {
  createUserValidation,
  updateUserValidation,
  warehouseAssignmentValidation
};
