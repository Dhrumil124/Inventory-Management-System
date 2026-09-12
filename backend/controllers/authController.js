const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { JWT } = require('../config/env');
const { ROLES } = require('../utils/constants');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

class AuthController {
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const [users] = await pool.execute(
        `SELECT u.id, u.role_id, r.name AS role, u.first_name, u.last_name, u.email, 
                u.password_hash, u.token_version, u.status 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.email = ?`,
        [email]
      );

      if (users.length === 0) {
        return errorResponse(res, 'Invalid email or password.', 401);
      }

      const user = users[0];

      if (user.status !== 'ACTIVE') {
        return errorResponse(res, 'Account is deactivated. Please contact your system administrator.', 403);
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return errorResponse(res, 'Invalid email or password.', 401);
      }

      // Generate JWT
      const token = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          tokenVersion: user.token_version
        },
        JWT.secret,
        { expiresIn: JWT.expiresIn }
      );

      // Load assigned warehouses
      let warehouses = [];
      if (user.role === ROLES.ADMIN) {
        const [allWh] = await pool.execute('SELECT id, name, code, city, status FROM warehouses WHERE status = ?', ['ACTIVE']);
        warehouses = allWh;
      } else {
        const [uwh] = await pool.execute(
          `SELECT w.id, w.name, w.code, w.city, w.status 
           FROM user_warehouses uw 
           JOIN warehouses w ON uw.warehouse_id = w.id 
           WHERE uw.user_id = ? AND w.status = 'ACTIVE'`,
          [user.id]
        );
        warehouses = uwh;
      }

      return successResponse(res, {
        token,
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
          warehouses
        }
      }, 'Login successful.');
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res, next) {
    try {
      const [users] = await pool.execute(
        `SELECT u.id, r.name AS role, u.first_name, u.last_name, u.email, u.status, u.created_at 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.id = ?`,
        [req.user.id]
      );

      if (users.length === 0) {
        return errorResponse(res, 'User not found.', 404);
      }

      const user = users[0];

      let warehouses = [];
      if (user.role === ROLES.ADMIN) {
        const [allWh] = await pool.execute('SELECT id, name, code, city, status FROM warehouses WHERE status = ?', ['ACTIVE']);
        warehouses = allWh;
      } else {
        const [uwh] = await pool.execute(
          `SELECT w.id, w.name, w.code, w.city, w.status 
           FROM user_warehouses uw 
           JOIN warehouses w ON uw.warehouse_id = w.id 
           WHERE uw.user_id = ? AND w.status = 'ACTIVE'`,
          [user.id]
        );
        warehouses = uwh;
      }

      return successResponse(res, {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.created_at,
        warehouses
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      // Invalidate existing sessions by incrementing token_version
      await pool.execute(
        'UPDATE users SET token_version = token_version + 1 WHERE id = ?',
        [req.user.id]
      );

      return successResponse(res, null, 'Logged out successfully. Active session invalidated.');
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      const [users] = await pool.execute(
        'SELECT password_hash, token_version FROM users WHERE id = ?',
        [req.user.id]
      );

      if (users.length === 0) {
        return errorResponse(res, 'User not found.', 404);
      }

      const user = users[0];
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        return errorResponse(res, 'Current password verification failed.', 400);
      }

      // Hash new password
      const newHash = await bcrypt.hash(newPassword, 10);
      const newTokenVersion = user.token_version + 1;

      // Update password and increment token_version (invalidating other active devices/tokens)
      await pool.execute(
        'UPDATE users SET password_hash = ?, token_version = ? WHERE id = ?',
        [newHash, newTokenVersion, req.user.id]
      );

      // Issue a fresh token for the current session
      const freshToken = jwt.sign(
        {
          userId: req.user.id,
          role: req.user.role,
          tokenVersion: newTokenVersion
        },
        JWT.secret,
        { expiresIn: JWT.expiresIn }
      );

      return successResponse(res, { token: freshToken }, 'Password updated successfully.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
