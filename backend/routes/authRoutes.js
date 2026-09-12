const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { loginValidation, changePasswordValidation } = require('../validators/authValidators');
const validateRequest = require('../middleware/validator');

router.post('/login', authLimiter, loginValidation, validateRequest, AuthController.login);
router.get('/me', authenticateToken, AuthController.getMe);
router.post('/logout', authenticateToken, AuthController.logout);
router.put('/change-password', authenticateToken, changePasswordValidation, validateRequest, AuthController.changePassword);

module.exports = router;
