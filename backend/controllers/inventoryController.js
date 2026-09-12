const pool = require('../config/db');
const InventoryService = require('../services/inventoryService');
const { ROLES } = require('../utils/constants');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

class InventoryController {
  static async getInventory(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10)));
      const offset = (page - 1) * limit;

      const search = req.query.search ? `%${req.query.search.trim()}%` : null;
      const warehouseId = req.query.warehouseId ? parseInt(req.query.warehouseId, 10) : null;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId, 10) : null;
      const stockStatus = req.query.stockStatus || null;

      let whereConditions = ['p.status = "ACTIVE"', 'w.status = "ACTIVE"'];
      let params = [];

      // Warehouse access boundary
      if (req.user.role !== ROLES.ADMIN) {
        if (req.user.assignedWarehouseIds.length === 0) {
          whereConditions.push('i.warehouse_id IN (-1)');
        } else {
          const ph = req.user.assignedWarehouseIds.map(() => '?').join(',');
          whereConditions.push(`i.warehouse_id IN (${ph})`);
          params.push(...req.user.assignedWarehouseIds);
        }
      }

      // Warehouse filter
      if (warehouseId) {
        // If user is not admin, verify they have access to requested warehouseId
        if (req.user.role !== ROLES.ADMIN && !req.user.assignedWarehouseIds.includes(warehouseId)) {
          return errorResponse(res, 'Forbidden: You do not have permission to access the requested warehouse inventory.', 403);
        }
        whereConditions.push('i.warehouse_id = ?');
        params.push(warehouseId);
      }

      // Category filter
      if (categoryId) {
        whereConditions.push('p.category_id = ?');
        params.push(categoryId);
      }

      // Search filter
      if (search) {
        whereConditions.push('(p.name LIKE ? OR p.sku LIKE ? OR w.name LIKE ?)');
        params.push(search, search, search);
      }

      // Stock status filter
      if (stockStatus === 'OUT_OF_STOCK') {
        whereConditions.push('i.quantity = 0');
      } else if (stockStatus === 'LOW_STOCK') {
        whereConditions.push('(i.quantity > 0 AND i.quantity <= p.minimum_stock)');
      } else if (stockStatus === 'IN_STOCK') {
        whereConditions.push('i.quantity > p.minimum_stock');
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Count
      const [countRows] = await pool.execute(
        `SELECT COUNT(*) AS total 
         FROM inventory i 
         JOIN products p ON i.product_id = p.id 
         JOIN warehouses w ON i.warehouse_id = w.id 
         JOIN categories c ON p.category_id = c.id 
         ${whereClause}`,
        params
      );
      const total = countRows[0].total;

      // Data
      const [inventoryRows] = await pool.execute(
        `SELECT i.id, i.product_id, i.warehouse_id, i.quantity, i.updated_at,
                p.sku, p.name AS product_name, p.unit, p.price, p.minimum_stock,
                c.id AS category_id, c.name AS category_name,
                w.code AS warehouse_code, w.name AS warehouse_name, w.city AS warehouse_city,
                a.alert_type, a.status AS alert_status
         FROM inventory i
         JOIN products p ON i.product_id = p.id
         JOIN warehouses w ON i.warehouse_id = w.id
         JOIN categories c ON p.category_id = c.id
         LEFT JOIN inventory_alerts a ON a.product_id = i.product_id AND a.warehouse_id = i.warehouse_id AND a.status = 'ACTIVE'
         ${whereClause}
         ORDER BY w.name ASC, p.name ASC
         LIMIT ${limit} OFFSET ${offset}`,
        params
      );

      return successResponse(res, inventoryRows, 'Inventory retrieved successfully.', 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      next(error);
    }
  }

  static async stockIn(req, res, next) {
    try {
      const { productId, warehouseId, quantity, reference, reason } = req.body;

      const result = await InventoryService.stockIn({
        productId: parseInt(productId, 10),
        warehouseId: parseInt(warehouseId, 10),
        quantity: parseInt(quantity, 10),
        reference,
        reason,
        userId: req.user.id
      });

      return successResponse(res, result, 'Stock In completed successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  static async stockOut(req, res, next) {
    try {
      const { productId, warehouseId, quantity, reference, reason } = req.body;

      const result = await InventoryService.stockOut({
        productId: parseInt(productId, 10),
        warehouseId: parseInt(warehouseId, 10),
        quantity: parseInt(quantity, 10),
        reference,
        reason,
        userId: req.user.id
      });

      return successResponse(res, result, 'Stock Out completed successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async transfer(req, res, next) {
    try {
      const { productId, sourceWarehouseId, destinationWarehouseId, quantity, reference, reason } = req.body;

      const result = await InventoryService.transferStock({
        productId: parseInt(productId, 10),
        sourceWarehouseId: parseInt(sourceWarehouseId, 10),
        destinationWarehouseId: parseInt(destinationWarehouseId, 10),
        quantity: parseInt(quantity, 10),
        reference,
        reason,
        userId: req.user.id
      });

      return successResponse(res, result, 'Stock transfer executed successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  static async adjustment(req, res, next) {
    try {
      const { productId, warehouseId, physicalQuantity, reason } = req.body;

      const result = await InventoryService.adjustStock({
        productId: parseInt(productId, 10),
        warehouseId: parseInt(warehouseId, 10),
        physicalQuantity: parseInt(physicalQuantity, 10),
        reason,
        userId: req.user.id
      });

      return successResponse(res, result, 'Inventory adjustment recorded successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '15', 10)));
      const offset = (page - 1) * limit;

      const search = req.query.search ? `%${req.query.search.trim()}%` : null;
      const warehouseId = req.query.warehouseId ? parseInt(req.query.warehouseId, 10) : null;
      const productId = req.query.productId ? parseInt(req.query.productId, 10) : null;
      const movementType = req.query.movementType || null;
      const startDate = req.query.startDate || null;
      const endDate = req.query.endDate || null;

      let whereConditions = [];
      let params = [];

      // Warehouse boundary
      if (req.user.role !== ROLES.ADMIN) {
        if (req.user.assignedWarehouseIds.length === 0) {
          whereConditions.push('sm.warehouse_id IN (-1)');
        } else {
          const ph = req.user.assignedWarehouseIds.map(() => '?').join(',');
          whereConditions.push(`sm.warehouse_id IN (${ph})`);
          params.push(...req.user.assignedWarehouseIds);
        }
      }

      if (warehouseId) {
        if (req.user.role !== ROLES.ADMIN && !req.user.assignedWarehouseIds.includes(warehouseId)) {
          return errorResponse(res, 'Forbidden: You do not have permission to view history for this warehouse.', 403);
        }
        whereConditions.push('sm.warehouse_id = ?');
        params.push(warehouseId);
      }

      if (productId) {
        whereConditions.push('sm.product_id = ?');
        params.push(productId);
      }

      if (movementType) {
        whereConditions.push('sm.movement_type = ?');
        params.push(movementType);
      }

      if (startDate) {
        whereConditions.push('DATE(sm.created_at) >= ?');
        params.push(startDate);
      }

      if (endDate) {
        whereConditions.push('DATE(sm.created_at) <= ?');
        params.push(endDate);
      }

      if (search) {
        whereConditions.push('(p.name LIKE ? OR p.sku LIKE ? OR sm.reference LIKE ? OR sm.reason LIKE ?)');
        params.push(search, search, search, search);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Count
      const [countRows] = await pool.execute(
        `SELECT COUNT(*) AS total 
         FROM stock_movements sm 
         JOIN products p ON sm.product_id = p.id 
         ${whereClause}`,
        params
      );
      const total = countRows[0].total;

      // Data
      const [historyRows] = await pool.execute(
        `SELECT sm.*, 
                p.sku, p.name AS product_name, p.unit,
                w.code AS warehouse_code, w.name AS warehouse_name,
                u.first_name, u.last_name, u.email AS user_email
         FROM stock_movements sm
         JOIN products p ON sm.product_id = p.id
         JOIN warehouses w ON sm.warehouse_id = w.id
         JOIN users u ON sm.user_id = u.id
         ${whereClause}
         ORDER BY sm.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        params
      );

      return successResponse(res, historyRows, 'Inventory history retrieved successfully.', 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAlerts(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '15', 10)));
      const offset = (page - 1) * limit;

      const status = req.query.status || 'ACTIVE'; // default to ACTIVE
      const alertType = req.query.alertType || null;
      const warehouseId = req.query.warehouseId ? parseInt(req.query.warehouseId, 10) : null;

      let whereConditions = [];
      let params = [];

      // Warehouse boundary
      if (req.user.role !== ROLES.ADMIN) {
        if (req.user.assignedWarehouseIds.length === 0) {
          whereConditions.push('a.warehouse_id IN (-1)');
        } else {
          const ph = req.user.assignedWarehouseIds.map(() => '?').join(',');
          whereConditions.push(`a.warehouse_id IN (${ph})`);
          params.push(...req.user.assignedWarehouseIds);
        }
      }

      if (warehouseId) {
        if (req.user.role !== ROLES.ADMIN && !req.user.assignedWarehouseIds.includes(warehouseId)) {
          return errorResponse(res, 'Forbidden: You do not have permission to view alerts for this warehouse.', 403);
        }
        whereConditions.push('a.warehouse_id = ?');
        params.push(warehouseId);
      }

      if (status && status !== 'ALL') {
        whereConditions.push('a.status = ?');
        params.push(status);
      }

      if (alertType) {
        whereConditions.push('a.alert_type = ?');
        params.push(alertType);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Count
      const [countRows] = await pool.execute(
        `SELECT COUNT(*) AS total 
         FROM inventory_alerts a 
         JOIN products p ON a.product_id = p.id 
         JOIN warehouses w ON a.warehouse_id = w.id 
         ${whereClause}`,
        params
      );
      const total = countRows[0].total;

      // Data
      const [alerts] = await pool.execute(
        `SELECT a.*, 
                p.sku, p.name AS product_name, p.unit, p.price,
                w.code AS warehouse_code, w.name AS warehouse_name
         FROM inventory_alerts a
         JOIN products p ON a.product_id = p.id
         JOIN warehouses w ON a.warehouse_id = w.id
         ${whereClause}
         ORDER BY CASE WHEN a.status = 'ACTIVE' THEN 0 ELSE 1 END, a.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        params
      );

      return successResponse(res, alerts, 'Alerts retrieved successfully.', 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = InventoryController;
