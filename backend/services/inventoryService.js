const pool = require('../config/db');
const { MOVEMENT_TYPES, ALERT_TYPES, ALERT_STATUSES } = require('../utils/constants');

class InventoryService {
  /**
   * Ensure an inventory record exists for product in warehouse, then lock it FOR UPDATE.
   */
  static async lockOrCreateInventory(conn, productId, warehouseId) {
    // 1. Try to lock existing row
    let [rows] = await conn.execute(
      'SELECT id, quantity FROM inventory WHERE product_id = ? AND warehouse_id = ? FOR UPDATE',
      [productId, warehouseId]
    );

    if (rows.length === 0) {
      // Create record with quantity 0
      await conn.execute(
        'INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE quantity = quantity',
        [productId, warehouseId]
      );
      // Lock newly created or existing row
      [rows] = await conn.execute(
        'SELECT id, quantity FROM inventory WHERE product_id = ? AND warehouse_id = ? FOR UPDATE',
        [productId, warehouseId]
      );
    }

    return rows[0];
  }

  /**
   * Alert state machine: guarantees exact single active alert or resolution.
   */
  static async syncAlertState(conn, productId, warehouseId, currentQuantity) {
    // 1. Get product minimum stock
    const [pRows] = await conn.execute(
      'SELECT minimum_stock FROM products WHERE id = ?',
      [productId]
    );

    if (pRows.length === 0) return;
    const minStock = pRows[0].minimum_stock;

    // 2. Lock any active alert row for this product + warehouse
    const [activeAlerts] = await conn.execute(
      'SELECT id, alert_type FROM inventory_alerts WHERE product_id = ? AND warehouse_id = ? AND status = ? FOR UPDATE',
      [productId, warehouseId, ALERT_STATUSES.ACTIVE]
    );

    const existingAlert = activeAlerts.length > 0 ? activeAlerts[0] : null;

    if (currentQuantity === 0) {
      // Target state: OUT_OF_STOCK
      if (existingAlert) {
        if (existingAlert.alert_type !== ALERT_TYPES.OUT_OF_STOCK) {
          await conn.execute(
            'UPDATE inventory_alerts SET alert_type = ?, current_quantity = 0, minimum_stock = ? WHERE id = ?',
            [ALERT_TYPES.OUT_OF_STOCK, minStock, existingAlert.id]
          );
        } else {
          await conn.execute(
            'UPDATE inventory_alerts SET current_quantity = 0, minimum_stock = ? WHERE id = ?',
            [minStock, existingAlert.id]
          );
        }
      } else {
        await conn.execute(
          `INSERT INTO inventory_alerts (product_id, warehouse_id, current_quantity, minimum_stock, alert_type, status)
           VALUES (?, ?, 0, ?, ?, ?)`,
          [productId, warehouseId, minStock, ALERT_TYPES.OUT_OF_STOCK, ALERT_STATUSES.ACTIVE]
        );
      }
    } else if (currentQuantity <= minStock) {
      // Target state: LOW_STOCK
      if (existingAlert) {
        if (existingAlert.alert_type !== ALERT_TYPES.LOW_STOCK) {
          await conn.execute(
            'UPDATE inventory_alerts SET alert_type = ?, current_quantity = ?, minimum_stock = ? WHERE id = ?',
            [ALERT_TYPES.LOW_STOCK, currentQuantity, minStock, existingAlert.id]
          );
        } else {
          await conn.execute(
            'UPDATE inventory_alerts SET current_quantity = ?, minimum_stock = ? WHERE id = ?',
            [currentQuantity, minStock, existingAlert.id]
          );
        }
      } else {
        await conn.execute(
          `INSERT INTO inventory_alerts (product_id, warehouse_id, current_quantity, minimum_stock, alert_type, status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [productId, warehouseId, currentQuantity, minStock, ALERT_TYPES.LOW_STOCK, ALERT_STATUSES.ACTIVE]
        );
      }
    } else {
      // Target state: RESOLVED (stock recovered above minimum threshold)
      if (existingAlert) {
        await conn.execute(
          'UPDATE inventory_alerts SET status = ?, resolved_at = NOW() WHERE id = ?',
          [ALERT_STATUSES.RESOLVED, existingAlert.id]
        );
      }
    }
  }

  /**
   * Execute Stock In: Atomically increases inventory, logs movement, synchronizes alerts.
   */
  static async stockIn({ productId, warehouseId, quantity, reference, reason, userId }) {
    if (quantity <= 0) {
      throw new Error('Stock In quantity must be greater than 0.');
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Lock row
      const invRow = await this.lockOrCreateInventory(conn, productId, warehouseId);
      const previousQuantity = invRow.quantity;
      const newQuantity = previousQuantity + quantity;

      // Update inventory
      await conn.execute(
        'UPDATE inventory SET quantity = ? WHERE id = ?',
        [newQuantity, invRow.id]
      );

      // Create immutable movement record
      const [moveRes] = await conn.execute(
        `INSERT INTO stock_movements 
         (product_id, warehouse_id, movement_type, quantity, previous_quantity, new_quantity, reference, reason, user_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [productId, warehouseId, MOVEMENT_TYPES.IN, quantity, previousQuantity, newQuantity, reference || null, reason, userId]
      );

      // Alert state machine
      await this.syncAlertState(conn, productId, warehouseId, newQuantity);

      await conn.commit();
      return {
        success: true,
        movementId: moveRes.insertId,
        productId,
        warehouseId,
        previousQuantity,
        newQuantity,
        quantityAdded: quantity
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Execute Stock Out: Atomically checks available stock, decreases inventory, logs movement, updates alerts.
   */
  static async stockOut({ productId, warehouseId, quantity, reference, reason, userId }) {
    if (quantity <= 0) {
      throw new Error('Stock Out quantity must be greater than 0.');
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Lock row
      const invRow = await this.lockOrCreateInventory(conn, productId, warehouseId);
      const previousQuantity = invRow.quantity;

      if (previousQuantity < quantity) {
        const err = new Error(`Insufficient stock available. Current stock is ${previousQuantity} units, requested ${quantity} units.`);
        err.statusCode = 400;
        throw err;
      }

      const newQuantity = previousQuantity - quantity;

      // Update inventory
      await conn.execute(
        'UPDATE inventory SET quantity = ? WHERE id = ?',
        [newQuantity, invRow.id]
      );

      // Create immutable movement record
      const [moveRes] = await conn.execute(
        `INSERT INTO stock_movements 
         (product_id, warehouse_id, movement_type, quantity, previous_quantity, new_quantity, reference, reason, user_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [productId, warehouseId, MOVEMENT_TYPES.OUT, quantity, previousQuantity, newQuantity, reference || null, reason, userId]
      );

      // Alert state machine
      await this.syncAlertState(conn, productId, warehouseId, newQuantity);

      await conn.commit();
      return {
        success: true,
        movementId: moveRes.insertId,
        productId,
        warehouseId,
        previousQuantity,
        newQuantity,
        quantityDeducted: quantity
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Execute Stock Transfer: Deterministic two-row locking to prevent race deadlocks.
   */
  static async transferStock({ productId, sourceWarehouseId, destinationWarehouseId, quantity, reference, reason, userId }) {
    if (quantity <= 0) {
      throw new Error('Transfer quantity must be greater than 0.');
    }

    if (sourceWarehouseId === destinationWarehouseId) {
      const err = new Error('Source and destination warehouses cannot be the same.');
      err.statusCode = 400;
      throw err;
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Ensure inventory records exist in both warehouses
      await conn.execute(
        'INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE id=id',
        [productId, sourceWarehouseId]
      );
      await conn.execute(
        'INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE id=id',
        [productId, destinationWarehouseId]
      );

      // 2. Deterministic Row Locking: Order by warehouse_id ASC to guarantee deadlock-free locking
      const [rows] = await conn.execute(
        `SELECT id, warehouse_id, quantity 
         FROM inventory 
         WHERE product_id = ? AND warehouse_id IN (?, ?) 
         ORDER BY warehouse_id ASC 
         FOR UPDATE`,
        [productId, sourceWarehouseId, destinationWarehouseId]
      );

      const sourceInv = rows.find(r => r.warehouse_id === sourceWarehouseId);
      const destInv = rows.find(r => r.warehouse_id === destinationWarehouseId);

      if (!sourceInv || !destInv) {
        throw new Error('Failed to lock inventory records for transfer.');
      }

      if (sourceInv.quantity < quantity) {
        const err = new Error(`Insufficient stock at source warehouse. Available: ${sourceInv.quantity} units, Requested: ${quantity} units.`);
        err.statusCode = 400;
        throw err;
      }

      const sourcePrev = sourceInv.quantity;
      const sourceNew = sourcePrev - quantity;
      const destPrev = destInv.quantity;
      const destNew = destPrev + quantity;

      // 3. Update source and destination inventory
      await conn.execute('UPDATE inventory SET quantity = ? WHERE id = ?', [sourceNew, sourceInv.id]);
      await conn.execute('UPDATE inventory SET quantity = ? WHERE id = ?', [destNew, destInv.id]);

      // 4. Generate unique transfer code
      const transferCode = `TRF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      // 5. Create transfer record (completed and immutable)
      const [trfRes] = await conn.execute(
        `INSERT INTO inventory_transfers 
         (transfer_code, source_warehouse_id, destination_warehouse_id, product_id, quantity, status, reference, reason, created_by) 
         VALUES (?, ?, ?, ?, ?, 'COMPLETED', ?, ?, ?)`,
        [transferCode, sourceWarehouseId, destinationWarehouseId, productId, quantity, reference || null, reason, userId]
      );

      // 6. Log TRANSFER_OUT movement for source
      await conn.execute(
        `INSERT INTO stock_movements 
         (product_id, warehouse_id, movement_type, quantity, previous_quantity, new_quantity, reference, reason, user_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [productId, sourceWarehouseId, MOVEMENT_TYPES.TRANSFER_OUT, quantity, sourcePrev, sourceNew, transferCode, `Transfer to WH ${destinationWarehouseId}: ${reason}`, userId]
      );

      // 7. Log TRANSFER_IN movement for destination
      await conn.execute(
        `INSERT INTO stock_movements 
         (product_id, warehouse_id, movement_type, quantity, previous_quantity, new_quantity, reference, reason, user_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [productId, destinationWarehouseId, MOVEMENT_TYPES.TRANSFER_IN, quantity, destPrev, destNew, transferCode, `Transfer from WH ${sourceWarehouseId}: ${reason}`, userId]
      );

      // 8. Synchronize alert state machine for both warehouses
      await this.syncAlertState(conn, productId, sourceWarehouseId, sourceNew);
      await this.syncAlertState(conn, productId, destinationWarehouseId, destNew);

      await conn.commit();
      return {
        success: true,
        transferId: trfRes.insertId,
        transferCode,
        productId,
        sourceWarehouseId,
        destinationWarehouseId,
        quantity,
        source: { previousQuantity: sourcePrev, newQuantity: sourceNew },
        destination: { previousQuantity: destPrev, newQuantity: destNew }
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Execute Stock Adjustment: Audited correction between system and physical count.
   */
  static async adjustStock({ productId, warehouseId, physicalQuantity, reason, userId }) {
    if (physicalQuantity < 0) {
      throw new Error('Physical counted quantity cannot be negative.');
    }

    if (!reason || reason.trim().length < 5) {
      throw new Error('A detailed reason (min 5 chars) is mandatory for inventory adjustment.');
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const invRow = await this.lockOrCreateInventory(conn, productId, warehouseId);
      const previousQuantity = invRow.quantity;

      if (previousQuantity === physicalQuantity) {
        await conn.rollback();
        return {
          success: true,
          message: 'Physical count matches current system inventory. No adjustment required.',
          previousQuantity,
          newQuantity: physicalQuantity,
          delta: 0
        };
      }

      const delta = physicalQuantity - previousQuantity;
      const absoluteQuantity = Math.abs(delta);
      const reference = `ADJ-${Date.now()}`;

      // Update inventory
      await conn.execute(
        'UPDATE inventory SET quantity = ? WHERE id = ?',
        [physicalQuantity, invRow.id]
      );

      // Create immutable movement record
      const [moveRes] = await conn.execute(
        `INSERT INTO stock_movements 
         (product_id, warehouse_id, movement_type, quantity, previous_quantity, new_quantity, reference, reason, user_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [productId, warehouseId, MOVEMENT_TYPES.ADJUSTMENT, absoluteQuantity, previousQuantity, physicalQuantity, reference, reason, userId]
      );

      // Alert state machine
      await this.syncAlertState(conn, productId, warehouseId, physicalQuantity);

      await conn.commit();
      return {
        success: true,
        movementId: moveRes.insertId,
        productId,
        warehouseId,
        previousQuantity,
        newQuantity: physicalQuantity,
        delta,
        reference
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
}

module.exports = InventoryService;
