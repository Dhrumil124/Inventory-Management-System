const pool = require('../config/db');
const { ROLES } = require('../utils/constants');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

class ProductController {
  static async listProducts(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10)));
      const offset = (page - 1) * limit;

      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId, 10) : null;
      const status = req.query.status || null;
      const stockStatus = req.query.stockStatus || null;

      let whereConditions = [];
      let params = [];

      if (req.query.search && req.query.search.trim()) {
        const terms = req.query.search.trim().split(/\s+/).filter(Boolean);
        terms.forEach((term) => {
          let altTerm = null;
          if (/^alumin/i.test(term)) {
            altTerm = term.toLowerCase().includes('ium')
              ? term.replace(/ium/i, 'um')
              : term.replace(/um/i, 'ium');
          }

          if (altTerm) {
            whereConditions.push('(p.name LIKE ? OR p.sku LIKE ? OR c.name LIKE ? OR p.name LIKE ? OR p.sku LIKE ?)');
            params.push(`%${term}%`, `%${term}%`, `%${term}%`, `%${altTerm}%`, `%${altTerm}%`);
          } else {
            whereConditions.push('(p.name LIKE ? OR p.sku LIKE ? OR c.name LIKE ?)');
            params.push(`%${term}%`, `%${term}%`, `%${term}%`);
          }
        });
      }

      if (categoryId) {
        whereConditions.push('p.category_id = ?');
        params.push(categoryId);
      }

      if (status) {
        whereConditions.push('p.status = ?');
        params.push(status);
      }

      // If user is not admin, scope stock calculations to their assigned warehouses
      let whFilterClause = '';
      let whParams = [];
      if (req.user.role !== ROLES.ADMIN) {
        if (req.user.assignedWarehouseIds.length === 0) {
          whFilterClause = 'AND i.warehouse_id IN (-1)';
        } else {
          const ph = req.user.assignedWarehouseIds.map(() => '?').join(',');
          whFilterClause = `AND i.warehouse_id IN (${ph})`;
          whParams = req.user.assignedWarehouseIds;
        }
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Count
      const [countRows] = await pool.execute(
        `SELECT COUNT(*) AS total 
         FROM products p 
         JOIN categories c ON p.category_id = c.id 
         ${whereClause}`,
        params
      );
      const total = countRows[0].total;

      // Data query
      const [products] = await pool.execute(
        `SELECT p.*, c.name AS category_name,
                COALESCE((SELECT SUM(i.quantity) FROM inventory i WHERE i.product_id = p.id ${whFilterClause}), 0) AS total_stock,
                (SELECT COUNT(*) FROM inventory_alerts a WHERE a.product_id = p.id AND a.status = 'ACTIVE') AS active_alerts_count
         FROM products p
         JOIN categories c ON p.category_id = c.id
         ${whereClause}
         ORDER BY p.name ASC
         LIMIT ${limit} OFFSET ${offset}`,
        [...whParams, ...params]
      );

      // Client-requested stock status filter (IN_STOCK, LOW_STOCK, OUT_OF_STOCK)
      let filteredProducts = products;
      if (stockStatus) {
        filteredProducts = products.filter(p => {
          const stock = Number(p.total_stock);
          const minStock = Number(p.minimum_stock);
          if (stockStatus === 'OUT_OF_STOCK') return stock === 0;
          if (stockStatus === 'LOW_STOCK') return stock > 0 && stock <= minStock;
          if (stockStatus === 'IN_STOCK') return stock > minStock;
          return true;
        });
      }

      return successResponse(res, filteredProducts, 'Products retrieved successfully.', 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProductById(req, res, next) {
    try {
      const productId = parseInt(req.params.id, 10);

      const [rows] = await pool.execute(
        `SELECT p.*, c.name AS category_name 
         FROM products p 
         JOIN categories c ON p.category_id = c.id 
         WHERE p.id = ?`,
        [productId]
      );

      if (rows.length === 0) {
        return errorResponse(res, 'Product not found.', 404);
      }

      const product = rows[0];

      // Per-warehouse stock availability (filtered to authorized warehouses if not Admin)
      let whClause = '';
      let whParams = [productId];
      if (req.user.role !== ROLES.ADMIN) {
        if (req.user.assignedWarehouseIds.length === 0) {
          whClause = 'AND w.id IN (-1)';
        } else {
          const ph = req.user.assignedWarehouseIds.map(() => '?').join(',');
          whClause = `AND w.id IN (${ph})`;
          whParams = [productId, ...req.user.assignedWarehouseIds];
        }
      }

      const [warehouseStock] = await pool.execute(
        `SELECT w.id AS warehouse_id, w.name AS warehouse_name, w.code AS warehouse_code, w.city,
                COALESCE(i.quantity, 0) AS quantity,
                a.alert_type,
                a.status AS alert_status
         FROM warehouses w
         LEFT JOIN inventory i ON i.warehouse_id = w.id AND i.product_id = ?
         LEFT JOIN inventory_alerts a ON a.warehouse_id = w.id AND a.product_id = ? AND a.status = 'ACTIVE'
         WHERE w.status = 'ACTIVE' ${whClause}
         ORDER BY w.name ASC`,
        [productId, ...whParams]
      );

      // Recent 5 movements for this product
      let movWhClause = '';
      let movParams = [productId];
      if (req.user.role !== ROLES.ADMIN) {
        if (req.user.assignedWarehouseIds.length === 0) {
          movWhClause = 'AND sm.warehouse_id IN (-1)';
        } else {
          const ph = req.user.assignedWarehouseIds.map(() => '?').join(',');
          movWhClause = `AND sm.warehouse_id IN (${ph})`;
          movParams = [productId, ...req.user.assignedWarehouseIds];
        }
      }

      const [movements] = await pool.execute(
        `SELECT sm.*, w.name AS warehouse_name, u.first_name, u.last_name 
         FROM stock_movements sm 
         JOIN warehouses w ON sm.warehouse_id = w.id 
         JOIN users u ON sm.user_id = u.id 
         WHERE sm.product_id = ? ${movWhClause}
         ORDER BY sm.created_at DESC 
         LIMIT 10`,
        movParams
      );

      return successResponse(res, {
        product,
        warehouseStock,
        recentMovements: movements
      }, 'Product details retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async createProduct(req, res, next) {
    try {
      const { sku, name, categoryId, description, unit, price, minimumStock } = req.body;

      const [existing] = await pool.execute('SELECT id FROM products WHERE sku = ?', [sku]);
      if (existing.length > 0) {
        return errorResponse(res, `A product with SKU '${sku}' already exists.`, 409);
      }

      // Check category exists
      const [cat] = await pool.execute('SELECT id FROM categories WHERE id = ?', [categoryId]);
      if (cat.length === 0) {
        return errorResponse(res, 'Selected category does not exist.', 400);
      }

      const [insertRes] = await pool.execute(
        `INSERT INTO products 
         (category_id, sku, name, description, unit, price, minimum_stock, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
        [categoryId, sku, name, description || null, unit || 'pcs', price || 0, minimumStock || 10]
      );

      return successResponse(
        res,
        { id: insertRes.insertId, sku, name, categoryId, price, minimumStock, status: 'ACTIVE' },
        'Product created successfully.',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req, res, next) {
    try {
      const productId = parseInt(req.params.id, 10);
      const { name, categoryId, description, unit, price, minimumStock, status } = req.body;

      const [prod] = await pool.execute('SELECT id FROM products WHERE id = ?', [productId]);
      if (prod.length === 0) {
        return errorResponse(res, 'Product not found.', 404);
      }

      const updates = [];
      const params = [];

      if (name) { updates.push('name = ?'); params.push(name); }
      if (categoryId) { updates.push('category_id = ?'); params.push(categoryId); }
      if (description !== undefined) { updates.push('description = ?'); params.push(description); }
      if (unit) { updates.push('unit = ?'); params.push(unit); }
      if (price !== undefined) { updates.push('price = ?'); params.push(price); }
      if (minimumStock !== undefined) { updates.push('minimum_stock = ?'); params.push(minimumStock); }
      if (status) { updates.push('status = ?'); params.push(status); }

      if (updates.length === 0) {
        return errorResponse(res, 'No update fields provided.', 400);
      }

      params.push(productId);
      await pool.execute(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params);

      return successResponse(res, { id: productId }, 'Product updated successfully.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProductController;
