const pool = require('../config/db');
const { ROLES } = require('../utils/constants');
const { successResponse } = require('../utils/responseFormatter');

class DashboardController {
  static async getMetrics(req, res, next) {
    try {
      let whClause = '';
      let whParams = [];

      if (req.user.role !== ROLES.ADMIN) {
        if (req.user.assignedWarehouseIds.length === 0) {
          whClause = 'AND warehouse_id IN (-1)';
        } else {
          const ph = req.user.assignedWarehouseIds.map(() => '?').join(',');
          whClause = `AND warehouse_id IN (${ph})`;
          whParams = req.user.assignedWarehouseIds;
        }
      }

      // Total Active Products
      const [prodCount] = await pool.execute('SELECT COUNT(*) AS total FROM products WHERE status = "ACTIVE"');

      // Total Warehouses Accessible
      let totalWarehouses = 0;
      if (req.user.role === ROLES.ADMIN) {
        const [whCount] = await pool.execute('SELECT COUNT(*) AS total FROM warehouses WHERE status = "ACTIVE"');
        totalWarehouses = whCount[0].total;
      } else {
        totalWarehouses = req.user.assignedWarehouseIds.length;
      }

      // Total Stock Units & Total Inventory Value
      const [stockVal] = await pool.execute(
        `SELECT 
           COALESCE(SUM(i.quantity), 0) AS total_stock,
           COALESCE(SUM(i.quantity * p.price), 0) AS total_value
         FROM inventory i
         JOIN products p ON i.product_id = p.id
         JOIN warehouses w ON i.warehouse_id = w.id
         WHERE p.status = 'ACTIVE' AND w.status = 'ACTIVE' ${whClause.replace(/warehouse_id/g, 'i.warehouse_id')}`,
        whParams
      );

      // Low Stock & Out of Stock Alerts
      const [alertCounts] = await pool.execute(
        `SELECT 
           SUM(CASE WHEN a.alert_type = 'LOW_STOCK' THEN 1 ELSE 0 END) AS low_stock,
           SUM(CASE WHEN a.alert_type = 'OUT_OF_STOCK' THEN 1 ELSE 0 END) AS out_of_stock
         FROM inventory_alerts a
         JOIN products p ON a.product_id = p.id
         JOIN warehouses w ON a.warehouse_id = w.id
         WHERE a.status = 'ACTIVE' AND p.status = 'ACTIVE' AND w.status = 'ACTIVE' ${whClause.replace(/warehouse_id/g, 'a.warehouse_id')}`,
        whParams
      );

      return successResponse(res, {
        totalProducts: prodCount[0].total,
        totalWarehouses,
        totalStock: Number(stockVal[0].total_stock),
        totalInventoryValue: Number(stockVal[0].total_value),
        lowStockAlerts: Number(alertCounts[0].low_stock || 0),
        outOfStockAlerts: Number(alertCounts[0].out_of_stock || 0)
      }, 'Dashboard metrics retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async getStockBreakdown(req, res, next) {
    try {
      let whClause = '';
      let whParams = [];

      if (req.user.role !== ROLES.ADMIN) {
        if (req.user.assignedWarehouseIds.length === 0) {
          whClause = 'AND i.warehouse_id IN (-1)';
        } else {
          const ph = req.user.assignedWarehouseIds.map(() => '?').join(',');
          whClause = `AND i.warehouse_id IN (${ph})`;
          whParams = req.user.assignedWarehouseIds;
        }
      }

      // 1. Warehouse-wise distribution
      const [warehouseStock] = await pool.execute(
        `SELECT w.id, w.name, w.code, w.city,
                COALESCE(SUM(i.quantity), 0) AS total_stock,
                COUNT(DISTINCT CASE WHEN i.quantity > 0 THEN i.product_id END) AS active_products_count
         FROM warehouses w
         LEFT JOIN inventory i ON w.id = i.warehouse_id
         WHERE w.status = 'ACTIVE' ${whClause.replace(/i\.warehouse_id/g, 'w.id')}
         GROUP BY w.id
         ORDER BY total_stock DESC`,
        whParams
      );

      // 2. Category-wise distribution
      const [categoryStock] = await pool.execute(
        `SELECT c.id, c.name,
                COALESCE(SUM(i.quantity), 0) AS total_stock,
                COUNT(DISTINCT p.id) AS product_count
         FROM categories c
         JOIN products p ON c.id = p.category_id
         LEFT JOIN inventory i ON p.id = i.product_id ${whClause}
         WHERE c.status = 'ACTIVE' AND p.status = 'ACTIVE'
         GROUP BY c.id
         ORDER BY total_stock DESC`,
        whParams
      );

      return successResponse(res, {
        warehouseStock,
        categoryStock
      }, 'Stock breakdown retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async getRecentActivity(req, res, next) {
    try {
      let whClause = '';
      let whParams = [];

      if (req.user.role !== ROLES.ADMIN) {
        if (req.user.assignedWarehouseIds.length === 0) {
          whClause = 'WHERE sm.warehouse_id IN (-1)';
        } else {
          const ph = req.user.assignedWarehouseIds.map(() => '?').join(',');
          whClause = `WHERE sm.warehouse_id IN (${ph})`;
          whParams = req.user.assignedWarehouseIds;
        }
      }

      const [recentMovements] = await pool.execute(
        `SELECT sm.*, 
                p.sku, p.name AS product_name, p.unit,
                w.code AS warehouse_code, w.name AS warehouse_name,
                u.first_name, u.last_name
         FROM stock_movements sm
         JOIN products p ON sm.product_id = p.id
         JOIN warehouses w ON sm.warehouse_id = w.id
         JOIN users u ON sm.user_id = u.id
         ${whClause}
         ORDER BY sm.created_at DESC
         LIMIT 8`,
        whParams
      );

      // Top Low stock products requiring attention
      const [criticalAlerts] = await pool.execute(
        `SELECT a.*, 
                p.sku, p.name AS product_name, p.unit,
                w.code AS warehouse_code, w.name AS warehouse_name
         FROM inventory_alerts a
         JOIN products p ON a.product_id = p.id
         JOIN warehouses w ON a.warehouse_id = w.id
         WHERE a.status = 'ACTIVE' ${whClause.replace(/WHERE sm\.warehouse_id/g, 'AND a.warehouse_id')}
         ORDER BY CASE WHEN a.alert_type = 'OUT_OF_STOCK' THEN 0 ELSE 1 END, a.created_at DESC
         LIMIT 5`,
        whParams
      );

      return successResponse(res, {
        recentMovements,
        criticalAlerts
      }, 'Recent activity retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DashboardController;
