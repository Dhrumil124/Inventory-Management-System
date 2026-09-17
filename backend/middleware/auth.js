const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { errorResponse } = require('../utils/responseFormatter');
const { JWT } = require('../config/env');
const { ROLES } = require('../utils/constants');

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication token required', 401);
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Token expired. Please log in again.', 401);
      }
      return errorResponse(res, 'Invalid authentication token.', 401);
    }

    // Verify user exists and check active status + token version in database
    const [users] = await pool.execute(
      `SELECT u.id, u.role_id, r.name AS role, u.first_name, u.last_name, u.email, u.token_version, u.status 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [decoded.userId]
    );

    if (users.length === 0) {
      return errorResponse(res, 'User account no longer exists.', 401);
    }

    const user = users[0];

    // Check if user account is deactivated
    if (user.status !== 'ACTIVE') {
      return errorResponse(res, 'Account is deactivated. Access denied.', 403);
    }

    // Check token version to enforce immediate logout / password-change invalidation
    if (decoded.tokenVersion !== user.token_version) {
      return errorResponse(res, 'Your session has expired. Please log in again.', 401);
    }

    // Load assigned warehouses
    let assignedWarehouseIds = [];
    if (user.role === ROLES.ADMIN) {
      // Admin has access to all warehouses
      const [whs] = await pool.execute('SELECT id FROM warehouses WHERE status = ?', ['ACTIVE']);
      assignedWarehouseIds = whs.map(w => w.id);
    } else {
      const [uwh] = await pool.execute(
        `SELECT uw.warehouse_id 
         FROM user_warehouses uw 
         JOIN warehouses w ON uw.warehouse_id = w.id 
         WHERE uw.user_id = ? AND w.status = 'ACTIVE'`,
        [user.id]
      );
      assignedWarehouseIds = uwh.map(w => w.warehouse_id);
    }

    req.user = {
      id: user.id,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      assignedWarehouseIds,
      tokenVersion: user.token_version
    };

    next();
  } catch (error) {
    console.error('[AUTH-MIDDLEWARE] Unexpected error:', error);
    return errorResponse(res, 'Authentication failed due to server error.', 500);
  }
}

module.exports = authenticateToken;
