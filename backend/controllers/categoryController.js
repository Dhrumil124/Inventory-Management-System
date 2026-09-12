const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

class CategoryController {
  static async listCategories(req, res, next) {
    try {
      const [categories] = await pool.execute(`
        SELECT c.*, 
          COUNT(p.id) AS product_count,
          SUM(CASE WHEN p.status = 'ACTIVE' THEN 1 ELSE 0 END) AS active_product_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
        GROUP BY c.id
        ORDER BY c.name ASC
      `);

      return successResponse(res, categories, 'Categories retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async getCategoryById(req, res, next) {
    try {
      const categoryId = parseInt(req.params.id, 10);
      const [rows] = await pool.execute(
        `SELECT c.*, COUNT(p.id) AS product_count 
         FROM categories c 
         LEFT JOIN products p ON c.id = p.category_id 
         WHERE c.id = ? 
         GROUP BY c.id`,
        [categoryId]
      );

      if (rows.length === 0) {
        return errorResponse(res, 'Category not found.', 404);
      }

      return successResponse(res, rows[0], 'Category retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req, res, next) {
    try {
      const { name, description } = req.body;

      const [existing] = await pool.execute('SELECT id FROM categories WHERE name = ?', [name]);
      if (existing.length > 0) {
        return errorResponse(res, 'Category name already exists.', 409);
      }

      const [insertRes] = await pool.execute(
        'INSERT INTO categories (name, description, status) VALUES (?, ?, "ACTIVE")',
        [name, description || null]
      );

      return successResponse(
        res,
        { id: insertRes.insertId, name, description, status: 'ACTIVE' },
        'Category created successfully.',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req, res, next) {
    try {
      const categoryId = parseInt(req.params.id, 10);
      const { name, description, status } = req.body;

      const [cat] = await pool.execute('SELECT id FROM categories WHERE id = ?', [categoryId]);
      if (cat.length === 0) {
        return errorResponse(res, 'Category not found.', 404);
      }

      const updates = [];
      const params = [];

      if (name) { updates.push('name = ?'); params.push(name); }
      if (description !== undefined) { updates.push('description = ?'); params.push(description); }
      if (status) { updates.push('status = ?'); params.push(status); }

      if (updates.length === 0) {
        return errorResponse(res, 'No update fields provided.', 400);
      }

      params.push(categoryId);
      await pool.execute(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, params);

      return successResponse(res, { id: categoryId }, 'Category updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  static async deleteCategory(req, res, next) {
    try {
      const categoryId = parseInt(req.params.id, 10);

      // Check if products are tied to this category
      const [prodRows] = await pool.execute(
        'SELECT COUNT(*) AS count FROM products WHERE category_id = ?',
        [categoryId]
      );

      if (prodRows[0].count > 0) {
        // Soft deactivate instead of hard delete to preserve relational integrity
        await pool.execute('UPDATE categories SET status = "INACTIVE" WHERE id = ?', [categoryId]);
        return successResponse(
          res,
          { id: categoryId, status: 'INACTIVE', message: 'Category has associated products and was safely deactivated instead of deleted.' },
          'Category deactivated to preserve product associations.'
        );
      }

      // If zero products, safe delete
      await pool.execute('DELETE FROM categories WHERE id = ?', [categoryId]);
      return successResponse(res, { id: categoryId }, 'Category deleted successfully.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CategoryController;
