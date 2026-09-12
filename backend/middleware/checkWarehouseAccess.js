const { errorResponse } = require('../utils/responseFormatter');
const { ROLES } = require('../utils/constants');
const pool = require('../config/db');

// Middleware to verify access to a single target warehouse (e.g. stock-in, stock-out, adjustment, details)
function verifyWarehouseAccess(idLocation = 'body', paramName = 'warehouseId') {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return errorResponse(res, 'Unauthorized. Please authenticate.', 401);
      }

      let warehouseId;
      if (idLocation === 'params') {
        warehouseId = parseInt(req.params[paramName] || req.params.id, 10);
      } else if (idLocation === 'query') {
        warehouseId = parseInt(req.query[paramName], 10);
      } else {
        warehouseId = parseInt(req.body[paramName], 10);
      }

      if (!warehouseId || isNaN(warehouseId)) {
        return errorResponse(res, `Valid ${paramName} is required.`, 400);
      }

      // 1. Verify warehouse exists and is active
      const [whRows] = await pool.execute(
        'SELECT id, name, status FROM warehouses WHERE id = ?',
        [warehouseId]
      );

      if (whRows.length === 0) {
        return errorResponse(res, 'Warehouse not found.', 404);
      }

      if (whRows[0].status !== 'ACTIVE') {
        return errorResponse(res, 'Warehouse is inactive or decommissioned.', 400);
      }

      // 2. If Admin, always permitted
      if (req.user.role === ROLES.ADMIN) {
        req.targetWarehouse = whRows[0];
        return next();
      }

      // 3. For Manager and Staff, verify assigned warehouse
      const isAssigned = req.user.assignedWarehouseIds.includes(warehouseId);
      if (!isAssigned) {
        return errorResponse(
          res,
          `Forbidden: You do not have permission to access warehouse ID ${warehouseId}.`,
          403
        );
      }

      req.targetWarehouse = whRows[0];
      next();
    } catch (error) {
      console.error('[WAREHOUSE-ACCESS] Verification failed:', error);
      return errorResponse(res, 'Server error verifying warehouse access.', 500);
    }
  };
}

// Middleware to verify access to BOTH source and destination warehouses for Stock Transfers
function verifyTransferWarehouseAccess() {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return errorResponse(res, 'Unauthorized. Please authenticate.', 401);
      }

      const sourceWarehouseId = parseInt(req.body.sourceWarehouseId, 10);
      const destinationWarehouseId = parseInt(req.body.destinationWarehouseId, 10);

      if (!sourceWarehouseId || isNaN(sourceWarehouseId)) {
        return errorResponse(res, 'Valid sourceWarehouseId is required.', 400);
      }

      if (!destinationWarehouseId || isNaN(destinationWarehouseId)) {
        return errorResponse(res, 'Valid destinationWarehouseId is required.', 400);
      }

      if (sourceWarehouseId === destinationWarehouseId) {
        return errorResponse(res, 'Source and destination warehouses cannot be the same.', 400);
      }

      // Verify both warehouses exist and are active
      const [whRows] = await pool.execute(
        'SELECT id, name, status FROM warehouses WHERE id IN (?, ?)',
        [sourceWarehouseId, destinationWarehouseId]
      );

      if (whRows.length < 2) {
        return errorResponse(res, 'One or both specified warehouses do not exist.', 404);
      }

      for (const wh of whRows) {
        if (wh.status !== 'ACTIVE') {
          return errorResponse(res, `Warehouse '${wh.name}' is inactive.`, 400);
        }
      }

      // If user is Admin, transfer between any warehouses is permitted
      if (req.user.role === ROLES.ADMIN) {
        return next();
      }

      // For STAFF: Transfers are restricted to Managers and Administrators only
      if (req.user.role === ROLES.STAFF) {
        return errorResponse(
          res,
          'Forbidden: Staff members are not authorized to execute inter-warehouse transfers. Transfers are reserved for Managers and Administrators.',
          403
        );
      }

      // For MANAGER: must be assigned to the source warehouse
      if (req.user.role === ROLES.MANAGER) {
        const hasSource = req.user.assignedWarehouseIds.includes(sourceWarehouseId);
        if (!hasSource) {
          return errorResponse(
            res,
            'Forbidden: Managers can only initiate transfers from their assigned facilities.',
            403
          );
        }
      }

      next();
    } catch (error) {
      console.error('[TRANSFER-ACCESS] Verification failed:', error);
      return errorResponse(res, 'Server error verifying transfer permissions.', 500);
    }
  };
}

module.exports = {
  verifyWarehouseAccess,
  verifyTransferWarehouseAccess
};
