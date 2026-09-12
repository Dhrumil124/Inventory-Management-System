const pool = require('../config/db');
const { ROLES } = require('../utils/constants');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

class WarehouseController {
  static async listWarehouses(req, res, next) {
    try {
      let query;
      let params = [];

      if (req.user.role === ROLES.ADMIN || req.query.all === 'true') {
        query = `
          SELECT w.*,
            (SELECT COUNT(DISTINCT i.product_id) FROM inventory i WHERE i.warehouse_id = w.id AND i.quantity > 0) AS total_active_skus,
            (SELECT COALESCE(SUM(i.quantity), 0) FROM inventory i WHERE i.warehouse_id = w.id) AS total_stock_units,
            (SELECT COUNT(*) FROM inventory_alerts a WHERE a.warehouse_id = w.id AND a.status = 'ACTIVE') AS active_alerts_count,
            (SELECT COUNT(*) FROM user_warehouses uw WHERE uw.warehouse_id = w.id) AS assigned_staff_count
          FROM warehouses w
          WHERE w.status = 'ACTIVE'
          ORDER BY w.name ASC
        `;
      } else {
        if (req.user.assignedWarehouseIds.length === 0) {
          return successResponse(res, [], 'No warehouses assigned to current user.');
        }
        const placeholders = req.user.assignedWarehouseIds.map(() => '?').join(',');
        query = `
          SELECT w.*,
            (SELECT COUNT(DISTINCT i.product_id) FROM inventory i WHERE i.warehouse_id = w.id AND i.quantity > 0) AS total_active_skus,
            (SELECT COALESCE(SUM(i.quantity), 0) FROM inventory i WHERE i.warehouse_id = w.id) AS total_stock_units,
            (SELECT COUNT(*) FROM inventory_alerts a WHERE a.warehouse_id = w.id AND a.status = 'ACTIVE') AS active_alerts_count,
            (SELECT COUNT(*) FROM user_warehouses uw WHERE uw.warehouse_id = w.id) AS assigned_staff_count
          FROM warehouses w
          WHERE w.id IN (${placeholders}) AND w.status = 'ACTIVE'
          ORDER BY w.name ASC
        `;
        params = req.user.assignedWarehouseIds;
      }

      const [warehouses] = await pool.execute(query, params);
      return successResponse(res, warehouses, 'Warehouses retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async getWarehouseById(req, res, next) {
    try {
      const warehouseId = parseInt(req.params.id, 10);

      // Verify access permission
      if (req.user.role !== ROLES.ADMIN && !req.user.assignedWarehouseIds.includes(warehouseId)) {
        return errorResponse(res, 'Forbidden: You do not have permission to access this warehouse.', 403);
      }

      const [rows] = await pool.execute('SELECT * FROM warehouses WHERE id = ?', [warehouseId]);
      if (rows.length === 0) {
        return errorResponse(res, 'Warehouse not found.', 404);
      }

      const warehouse = rows[0];

      // Summary statistics
      const [stats] = await pool.execute(
        `SELECT 
           COUNT(DISTINCT i.product_id) AS total_products,
           COALESCE(SUM(i.quantity), 0) AS total_quantity,
           SUM(CASE WHEN a.alert_type = 'LOW_STOCK' THEN 1 ELSE 0 END) AS low_stock_count,
           SUM(CASE WHEN a.alert_type = 'OUT_OF_STOCK' THEN 1 ELSE 0 END) AS out_of_stock_count
         FROM inventory i
         LEFT JOIN inventory_alerts a ON a.product_id = i.product_id AND a.warehouse_id = i.warehouse_id AND a.status = 'ACTIVE'
         WHERE i.warehouse_id = ?`,
        [warehouseId]
      );

      // Assigned users list
      const [assignedUsers] = await pool.execute(
        `SELECT u.id, u.first_name, u.last_name, u.email, r.name AS role 
         FROM user_warehouses uw 
         JOIN users u ON uw.user_id = u.id 
         JOIN roles r ON u.role_id = r.id 
         WHERE uw.warehouse_id = ? AND u.status = 'ACTIVE'`,
        [warehouseId]
      );

      // Recent 5 movements in this warehouse
      const [recentMovements] = await pool.execute(
        `SELECT sm.*, p.name AS product_name, p.sku, u.first_name, u.last_name 
         FROM stock_movements sm 
         JOIN products p ON sm.product_id = p.id 
         JOIN users u ON sm.user_id = u.id 
         WHERE sm.warehouse_id = ? 
         ORDER BY sm.created_at DESC 
         LIMIT 5`,
        [warehouseId]
      );

      return successResponse(res, {
        warehouse,
        stats: stats[0],
        assignedUsers,
        recentMovements
      }, 'Warehouse details retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async createWarehouse(req, res, next) {
    try {
      const { name, code, address, city, state, country, pincode, contactPerson, phone, email } = req.body;

      const [existing] = await pool.execute('SELECT id FROM warehouses WHERE code = ?', [code]);
      if (existing.length > 0) {
        return errorResponse(res, 'Warehouse code must be unique. A warehouse with this code already exists.', 409);
      }

      const [insertRes] = await pool.execute(
        `INSERT INTO warehouses 
         (name, code, address, city, state, country, pincode, contact_person, phone, email, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
        [name, code, address, city, state, country || 'India', pincode, contactPerson || null, phone || null, email || null]
      );

      return successResponse(
        res,
        { id: insertRes.insertId, name, code, city, status: 'ACTIVE' },
        'Warehouse created successfully.',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  static async updateWarehouse(req, res, next) {
    try {
      const warehouseId = parseInt(req.params.id, 10);
      const { name, address, city, state, country, pincode, contactPerson, phone, email, status } = req.body;

      const [wh] = await pool.execute('SELECT id FROM warehouses WHERE id = ?', [warehouseId]);
      if (wh.length === 0) {
        return errorResponse(res, 'Warehouse not found.', 404);
      }

      const updates = [];
      const params = [];

      if (name) { updates.push('name = ?'); params.push(name); }
      if (address) { updates.push('address = ?'); params.push(address); }
      if (city) { updates.push('city = ?'); params.push(city); }
      if (state) { updates.push('state = ?'); params.push(state); }
      if (country) { updates.push('country = ?'); params.push(country); }
      if (pincode) { updates.push('pincode = ?'); params.push(pincode); }
      if (contactPerson !== undefined) { updates.push('contact_person = ?'); params.push(contactPerson); }
      if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
      if (email !== undefined) { updates.push('email = ?'); params.push(email); }
      if (status) { updates.push('status = ?'); params.push(status); }

      if (updates.length === 0) {
        return errorResponse(res, 'No fields to update provided.', 400);
      }

      params.push(warehouseId);
      await pool.execute(`UPDATE warehouses SET ${updates.join(', ')} WHERE id = ?`, params);

      return successResponse(res, { id: warehouseId }, 'Warehouse updated successfully.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = WarehouseController;
