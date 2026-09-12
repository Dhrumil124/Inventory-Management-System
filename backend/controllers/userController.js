const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

class UserController {
  static async listUsers(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10)));
      const offset = (page - 1) * limit;

      const search = req.query.search ? `%${req.query.search.trim()}%` : null;
      const role = req.query.role || null;
      const status = req.query.status || null;

      let whereConditions = [];
      let params = [];

      if (search) {
        whereConditions.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)');
        params.push(search, search, search);
      }

      if (role) {
        whereConditions.push('r.name = ?');
        params.push(role);
      }

      if (status) {
        whereConditions.push('u.status = ?');
        params.push(status);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Count query
      const [countRows] = await pool.execute(
        `SELECT COUNT(*) AS total 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         ${whereClause}`,
        params
      );
      const total = countRows[0].total;

      // Data query
      const [users] = await pool.execute(
        `SELECT u.id, u.first_name, u.last_name, u.email, r.name AS role, u.role_id, 
                u.status, u.created_at, u.updated_at,
                (SELECT COUNT(*) FROM user_warehouses uw WHERE uw.user_id = u.id) AS assigned_warehouse_count
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         ${whereClause} 
         ORDER BY u.created_at DESC 
         LIMIT ${limit} OFFSET ${offset}`,
        params
      );

      return successResponse(res, users, 'Users retrieved successfully.', 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req, res, next) {
    try {
      const userId = parseInt(req.params.id, 10);

      const [users] = await pool.execute(
        `SELECT u.id, u.first_name, u.last_name, u.email, r.name AS role, u.role_id, 
                u.status, u.created_at, u.updated_at 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.id = ?`,
        [userId]
      );

      if (users.length === 0) {
        return errorResponse(res, 'User not found.', 404);
      }

      const user = users[0];

      // Fetch assigned warehouses
      const [warehouses] = await pool.execute(
        `SELECT w.id, w.name, w.code, w.city, w.status 
         FROM user_warehouses uw 
         JOIN warehouses w ON uw.warehouse_id = w.id 
         WHERE uw.user_id = ?`,
        [userId]
      );

      user.warehouses = warehouses;

      return successResponse(res, user, 'User details retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req, res, next) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const { firstName, lastName, email, password, roleId, warehouseIds } = req.body;

      // Check email uniqueness
      const [existing] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        await conn.rollback();
        return errorResponse(res, 'A user with this email address already exists.', 409);
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      const [insertRes] = await conn.execute(
        `INSERT INTO users (role_id, first_name, last_name, email, password_hash, token_version, status) 
         VALUES (?, ?, ?, ?, ?, 1, 'ACTIVE')`,
        [roleId, firstName, lastName, email, passwordHash]
      );

      const newUserId = insertRes.insertId;

      // Assign initial warehouses if provided
      if (Array.isArray(warehouseIds) && warehouseIds.length > 0) {
        for (const whId of warehouseIds) {
          const [whCheck] = await conn.execute('SELECT id, status FROM warehouses WHERE id = ?', [whId]);
          if (whCheck.length > 0 && whCheck[0].status === 'ACTIVE') {
            await conn.execute(
              'INSERT INTO user_warehouses (user_id, warehouse_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE id=id',
              [newUserId, whId]
            );
          }
        }
      }

      await conn.commit();
      return successResponse(
        res,
        { id: newUserId, firstName, lastName, email, roleId },
        'User created successfully.',
        201
      );
    } catch (error) {
      await conn.rollback();
      next(error);
    } finally {
      conn.release();
    }
  }

  static async updateUser(req, res, next) {
    try {
      const userId = parseInt(req.params.id, 10);
      const { firstName, lastName, roleId, status } = req.body;

      const [users] = await pool.execute('SELECT id, status, token_version FROM users WHERE id = ?', [userId]);
      if (users.length === 0) {
        return errorResponse(res, 'User not found.', 404);
      }

      const updates = [];
      const params = [];

      if (firstName) {
        updates.push('first_name = ?');
        params.push(firstName);
      }
      if (lastName) {
        updates.push('last_name = ?');
        params.push(lastName);
      }
      if (roleId) {
        updates.push('role_id = ?');
        params.push(roleId);
      }
      if (status) {
        updates.push('status = ?');
        params.push(status);

        // If user is deactivated, immediately bump token_version to invalidate any active JWT sessions!
        if (status === 'INACTIVE') {
          updates.push('token_version = token_version + 1');
        }
      }

      if (updates.length === 0) {
        return errorResponse(res, 'No fields to update provided.', 400);
      }

      params.push(userId);
      await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

      return successResponse(res, { id: userId }, 'User updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async assignWarehouse(req, res, next) {
    try {
      const userId = parseInt(req.params.id, 10);
      const { warehouseId } = req.body;

      // 1. Verify user exists and is active
      const [uRows] = await pool.execute('SELECT id, status FROM users WHERE id = ?', [userId]);
      if (uRows.length === 0) {
        return errorResponse(res, 'User not found.', 404);
      }
      if (uRows[0].status !== 'ACTIVE') {
        return errorResponse(res, 'Cannot assign warehouse to a deactivated user.', 400);
      }

      // 2. Verify warehouse exists and is active
      const [whRows] = await pool.execute('SELECT id, status, name FROM warehouses WHERE id = ?', [warehouseId]);
      if (whRows.length === 0) {
        return errorResponse(res, 'Warehouse not found.', 404);
      }
      if (whRows[0].status !== 'ACTIVE') {
        return errorResponse(res, 'Cannot assign an inactive warehouse.', 400);
      }

      // 3. Insert assignment
      await pool.execute(
        'INSERT INTO user_warehouses (user_id, warehouse_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE id=id',
        [userId, warehouseId]
      );

      return successResponse(res, { userId, warehouseId }, 'Warehouse assigned successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async revokeWarehouse(req, res, next) {
    try {
      const userId = parseInt(req.params.id, 10);
      const warehouseId = parseInt(req.params.warehouseId, 10);

      const [resDel] = await pool.execute(
        'DELETE FROM user_warehouses WHERE user_id = ? AND warehouse_id = ?',
        [userId, warehouseId]
      );

      if (resDel.affectedRows === 0) {
        return errorResponse(res, 'Assignment does not exist or has already been revoked.', 404);
      }

      return successResponse(res, { userId, warehouseId }, 'Warehouse assignment revoked successfully.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
