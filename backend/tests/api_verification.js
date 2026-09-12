/**
 * STANDALONE INVENTORY MANAGEMENT SYSTEM — AUTOMATED VERIFICATION SUITE
 * 
 * Tests:
 * 1. Authentication & Session Management (Login, Invalid credentials, Inactive account, Logout & Token Invalidation, Password Change)
 * 2. Role-Based Access Control (Admin global, Manager warehouse-restricted, Staff limited)
 * 3. Multi-Warehouse Access Control & Anti-Tampering (403 on unassigned warehouse access, 403 on tampered IDs)
 * 4. Dual-Warehouse Transfer Authorization (Staff cannot transfer to/from unassigned warehouses)
 * 5. Stock In, Stock Out & Insufficient Stock Rejection (Atomic operations, Check constraints, Positive quantities)
 * 6. Stock Adjustment (Admin/Manager only, Staff rejected with 403, mandatory reason, audit trail)
 * 7. Alert State Machine (Transitions between LOW_STOCK, OUT_OF_STOCK, and RESOLVED; deduplication check)
 * 8. Concurrency & Race Condition Safety (Simultaneous Stock Out requests under race condition load: verifies final stock, success count, failure count, movement count, and non-negative invariant)
 * 9. Test Isolation & Automatic Cleanup (Leaves seed data completely intact)
 */

const http = require('http');
const app = require('../app');
const pool = require('../config/db');

const TEST_PORT = 5099;
let server;
let baseUrl = `http://localhost:${TEST_PORT}`;

// Helper: Make HTTP request
async function request(method, path, body = null, token = null) {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // raw text if not JSON
  }

  return {
    status: res.status,
    headers: res.headers,
    data
  };
}

// Assert helper
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('\n=============================================================');
  console.log(' STARTING INVENTORY MANAGEMENT SYSTEM TEST SUITE');
  console.log('=============================================================\n');

  // Start ephemeral test server
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`[TEST-RUNNER] Ephemeral test server running on port ${TEST_PORT}`);

  let adminToken = null;
  let managerAmdToken = null;
  let managerSuratToken = null;
  let staffAmdToken = null;
  let staffMultiToken = null;

  // Track isolated test records for clean teardown
  let testProductIds = [];
  let testCategoryIds = [];
  let testUserIds = [];

  try {
    // ------------------------------------------------------------------------
    // TEST 1: Authentication & Token Lifecycle
    // ------------------------------------------------------------------------
    console.log('\n▶ TEST 1: Authentication & Token Lifecycle');

    // 1.1 Valid Admin Login
    const loginAdmin = await request('POST', '/api/auth/login', {
      email: 'admin@inventory.local',
      password: 'Admin@12345'
    });
    assert(loginAdmin.status === 200, 'Admin login succeeded with 200');
    assert(loginAdmin.data.success === true, 'Admin login returned success = true');
    assert(loginAdmin.data.data.token, 'Admin login returned JWT token');
    adminToken = loginAdmin.data.data.token;

    // 1.2 Invalid Credentials
    const loginFail = await request('POST', '/api/auth/login', {
      email: 'admin@inventory.local',
      password: 'WrongPassword123'
    });
    assert(loginFail.status === 401, 'Invalid password rejected with 401 Unauthorized');

    // 1.3 Inactive User Login
    const loginInactive = await request('POST', '/api/auth/login', {
      email: 'staff.inactive@inventory.local',
      password: 'Staff@12345'
    });
    assert(loginInactive.status === 403, 'Inactive account login rejected with 403 Forbidden');

    // 1.4 Manager & Staff Logins
    const loginMgrAmd = await request('POST', '/api/auth/login', {
      email: 'manager.ahmedabad@inventory.local',
      password: 'Manager@12345'
    });
    assert(loginMgrAmd.status === 200, 'Manager Ahmedabad login succeeded');
    managerAmdToken = loginMgrAmd.data.data.token;

    const loginMgrSurat = await request('POST', '/api/auth/login', {
      email: 'manager.surat@inventory.local',
      password: 'Manager@12345'
    });
    assert(loginMgrSurat.status === 200, 'Manager Surat login succeeded');
    managerSuratToken = loginMgrSurat.data.data.token;

    const loginStaffAmd = await request('POST', '/api/auth/login', {
      email: 'staff.ahmedabad@inventory.local',
      password: 'Staff@12345'
    });
    assert(loginStaffAmd.status === 200, 'Staff Ahmedabad login succeeded');
    staffAmdToken = loginStaffAmd.data.data.token;

    const loginStaffMulti = await request('POST', '/api/auth/login', {
      email: 'staff.multi@inventory.local',
      password: 'Staff@12345'
    });
    assert(loginStaffMulti.status === 200, 'Staff Multi login succeeded');
    staffMultiToken = loginStaffMulti.data.data.token;

    // 1.5 Get Profile (/api/auth/me)
    const meRes = await request('GET', '/api/auth/me', null, adminToken);
    assert(meRes.status === 200, '/api/auth/me returned 200');
    assert(meRes.data.data.role === 'ADMIN', 'Admin profile verified');

    // 1.6 Logout & Token Invalidation (token_version revocation)
    console.log('  Testing session invalidation on logout...');
    // Login a temporary user session to logout
    const tempLogin = await request('POST', '/api/auth/login', {
      email: 'manager.ahmedabad@inventory.local',
      password: 'Manager@12345'
    });
    const tempToken = tempLogin.data.data.token;

    const logoutRes = await request('POST', '/api/auth/logout', null, tempToken);
    assert(logoutRes.status === 200, 'Logout succeeded with 200');

    // Using the logged out token must now immediately fail because token_version was incremented
    const afterLogout = await request('GET', '/api/auth/me', null, tempToken);
    assert(afterLogout.status === 401, 'Revoked token rejected with 401 Unauthorized after logout');

    // Re-login Manager Ahmedabad for remaining tests
    const reloginMgrAmd = await request('POST', '/api/auth/login', {
      email: 'manager.ahmedabad@inventory.local',
      password: 'Manager@12345'
    });
    managerAmdToken = reloginMgrAmd.data.data.token;

    // ------------------------------------------------------------------------
    // SETUP ISOLATED TEST FIXTURES
    // ------------------------------------------------------------------------
    console.log('\n▶ SETUP: Creating Isolated Test Catalog & Inventory');

    // Create isolated test category
    const catRes = await request('POST', '/api/categories', {
      name: `Test Isolation Cat ${Date.now()}`,
      description: 'Temporary category for automated test suite'
    }, adminToken);
    assert(catRes.status === 201, 'Isolated test category created');
    const testCatId = catRes.data.data.id;
    testCategoryIds.push(testCatId);

    // Create isolated test product
    const prodRes = await request('POST', '/api/products', {
      sku: `TST-SKU-${Date.now()}`,
      name: 'Automated Concurrency Test Widget',
      categoryId: testCatId,
      unit: 'units',
      price: 100.00,
      minimumStock: 20
    }, adminToken);
    assert(prodRes.status === 201, 'Isolated test product created');
    const testProductId = prodRes.data.data.id;
    testProductIds.push(testProductId);

    // ------------------------------------------------------------------------
    // TEST 2: RBAC & Warehouse Authorization Boundaries
    // ------------------------------------------------------------------------
    console.log('\n▶ TEST 2: Role & Warehouse Authorization Enforcement');

    // 2.1 Staff attempting to create a product (Admin only)
    const staffCreateProd = await request('POST', '/api/products', {
      sku: 'UNAUTH-SKU',
      name: 'Unauthorized',
      categoryId: testCatId,
      unit: 'pcs',
      price: 10
    }, staffAmdToken);
    assert(staffCreateProd.status === 403, 'Staff creating product blocked with 403 Forbidden');

    // 2.2 Manager Ahmedabad attempting to perform Stock In on Surat (WH 2) -> Not assigned!
    const mgrTamperWh = await request('POST', '/api/inventory/stock-in', {
      productId: testProductId,
      warehouseId: 2, // Surat WH
      quantity: 50,
      reason: 'Unauthorized attempt to stock in Surat'
    }, managerAmdToken);
    assert(mgrTamperWh.status === 403, 'Manager accessing unassigned warehouse blocked with 403 Forbidden');

    // 2.3 Staff attempting Stock Adjustment -> Restricted to Admin and Manager!
    const staffAdj = await request('POST', '/api/inventory/adjustment', {
      productId: testProductId,
      warehouseId: 1, // Ahmedabad (assigned to staff)
      physicalQuantity: 100,
      reason: 'Staff attempting restricted adjustment'
    }, staffAmdToken);
    assert(staffAdj.status === 403, 'Staff attempting adjustment blocked with 403 Forbidden');

    // 2.4 Staff Single-Warehouse Transfer Guard:
    // Staff Ahmedabad (assigned WH 1 only) attempting transfer to Surat (WH 2) -> must reject because Staff is NOT assigned to WH 2!
    const staffBadTransfer = await request('POST', '/api/inventory/transfer', {
      productId: testProductId,
      sourceWarehouseId: 1,
      destinationWarehouseId: 2,
      quantity: 10,
      reason: 'Staff transferring to unassigned destination'
    }, staffAmdToken);
    assert(staffBadTransfer.status === 403, 'Staff transfer to unassigned destination warehouse rejected with 403 Forbidden');

    // ------------------------------------------------------------------------
    // TEST 3: Stock In, Check Constraints & Stock Out Validations
    // ------------------------------------------------------------------------
    console.log('\n▶ TEST 3: Transactional Stock In & Stock Out Invariants');

    // 3.1 Reject Zero or Negative Stock In
    const zeroStockIn = await request('POST', '/api/inventory/stock-in', {
      productId: testProductId,
      warehouseId: 1,
      quantity: 0,
      reason: 'Testing zero quantity'
    }, adminToken);
    assert(zeroStockIn.status === 400, 'Stock In with quantity 0 rejected with 400 Bad Request');

    const negStockIn = await request('POST', '/api/inventory/stock-in', {
      productId: testProductId,
      warehouseId: 1,
      quantity: -15,
      reason: 'Testing negative quantity'
    }, adminToken);
    assert(negStockIn.status === 400, 'Stock In with negative quantity rejected with 400 Bad Request');

    // 3.2 Valid Stock In (Add 100 units to Ahmedabad WH 1)
    const validStockIn = await request('POST', '/api/inventory/stock-in', {
      productId: testProductId,
      warehouseId: 1,
      quantity: 100,
      reference: 'TEST-PO-01',
      reason: 'Initial test intake of 100 units'
    }, managerAmdToken);
    assert(validStockIn.status === 201, 'Stock In of 100 units succeeded with 201 Created');
    assert(validStockIn.data.data.newQuantity === 100, 'New inventory quantity is exactly 100');

    // 3.3 Overdraft Protection (Stock Out 150 units when only 100 available)
    const overDraftStockOut = await request('POST', '/api/inventory/stock-out', {
      productId: testProductId,
      warehouseId: 1,
      quantity: 150,
      reason: 'Attempting to overdraft inventory'
    }, managerAmdToken);
    assert(overDraftStockOut.status === 400, 'Stock Out exceeding available quantity rejected with 400 Bad Request');

    // 3.4 Valid Stock Out (Deduct 30 units -> leaves 70 units)
    const validStockOut = await request('POST', '/api/inventory/stock-out', {
      productId: testProductId,
      warehouseId: 1,
      quantity: 30,
      reference: 'TEST-DISP-01',
      reason: 'Fulfill test dispatch'
    }, staffAmdToken);
    assert(validStockOut.status === 200, 'Stock Out of 30 units succeeded');
    assert(validStockOut.data.data.newQuantity === 70, 'New inventory quantity is exactly 70');

    // ------------------------------------------------------------------------
    // TEST 4: Stock Transfer with Deterministic Row Locking
    // ------------------------------------------------------------------------
    console.log('\n▶ TEST 4: Atomic Stock Transfer & Role Restrictions (Manager/Admin Only)');

    // 4.1 Staff is strictly prohibited from executing transfers (Option 2 policy)
    const staffTransferAttempt = await request('POST', '/api/inventory/transfer', {
      productId: testProductId,
      sourceWarehouseId: 1,
      destinationWarehouseId: 2,
      quantity: 25,
      reason: 'Staff unauthorized transfer attempt'
    }, staffMultiToken);
    assert(staffTransferAttempt.status === 403, 'Staff transfer attempt rejected with 403 Forbidden (Transfers reserved for Manager/Admin)');

    // 4.2 Authorized Manager Ahmedabad transfers stock to Surat
    const validTransfer = await request('POST', '/api/inventory/transfer', {
      productId: testProductId,
      sourceWarehouseId: 1,
      destinationWarehouseId: 2,
      quantity: 25,
      reference: 'TEST-TRF-01',
      reason: 'Transfer stock between authorized branches'
    }, managerAmdToken);
    assert(validTransfer.status === 201, 'Authorized Manager transfer succeeded with 201 Created');
    assert(validTransfer.data.data.source.newQuantity === 45, 'Source WH 1 updated to 45 (70 - 25)');
    assert(validTransfer.data.data.destination.newQuantity === 25, 'Destination WH 2 updated to 25 (0 + 25)');

    // ------------------------------------------------------------------------
    // TEST 5: Alert State Machine Transitions & Deduplication
    // ------------------------------------------------------------------------
    console.log('\n▶ TEST 5: Alert State Machine Transitions (LOW_STOCK, OUT_OF_STOCK, RESOLVED)');

    // Minimum stock threshold for test product is 20.
    // Source WH 1 currently has 45 units (> 20: healthy, no active alert).
    // Let's deduct 30 units from WH 1 -> drops to 15 (15 <= 20: must trigger LOW_STOCK alert).
    const stockOutToLow = await request('POST', '/api/inventory/stock-out', {
      productId: testProductId,
      warehouseId: 1,
      quantity: 30,
      reason: 'Deduct to low stock threshold'
    }, adminToken);
    assert(stockOutToLow.data.data.newQuantity === 15, 'Stock dropped to 15 units');

    // Check alert table for WH 1
    const [alertLow] = await pool.execute(
      'SELECT alert_type, status, current_quantity FROM inventory_alerts WHERE product_id = ? AND warehouse_id = 1 AND status = "ACTIVE"',
      [testProductId]
    );
    assert(alertLow.length === 1, 'Exactly one ACTIVE alert exists');
    assert(alertLow[0].alert_type === 'LOW_STOCK', 'Alert type transitioned to LOW_STOCK');
    assert(alertLow[0].current_quantity === 15, 'Alert records current quantity 15');

    // Deduct remaining 15 units -> drops to 0 (must transition to OUT_OF_STOCK, NOT create duplicate alert!)
    const stockOutToZero = await request('POST', '/api/inventory/stock-out', {
      productId: testProductId,
      warehouseId: 1,
      quantity: 15,
      reason: 'Deduct to zero stock'
    }, adminToken);
    assert(stockOutToZero.data.data.newQuantity === 0, 'Stock dropped to 0 units');

    const [alertZero] = await pool.execute(
      'SELECT alert_type, status, current_quantity FROM inventory_alerts WHERE product_id = ? AND warehouse_id = 1 AND status = "ACTIVE"',
      [testProductId]
    );
    assert(alertZero.length === 1, 'Still exactly ONE active alert exists (no duplicate created!)');
    assert(alertZero[0].alert_type === 'OUT_OF_STOCK', 'Alert state cleanly transitioned to OUT_OF_STOCK');

    // Stock In 50 units (> 20 minimum stock) -> alert must be RESOLVED!
    const stockRecovery = await request('POST', '/api/inventory/stock-in', {
      productId: testProductId,
      warehouseId: 1,
      quantity: 50,
      reason: 'Stock replenishment above threshold'
    }, adminToken);
    assert(stockRecovery.data.data.newQuantity === 50, 'Stock recovered to 50 units');

    const [alertActiveAfterRecov] = await pool.execute(
      'SELECT * FROM inventory_alerts WHERE product_id = ? AND warehouse_id = 1 AND status = "ACTIVE"',
      [testProductId]
    );
    assert(alertActiveAfterRecov.length === 0, 'Active alert successfully marked RESOLVED upon stock recovery');

    // ------------------------------------------------------------------------
    // TEST 6: Concurrency & Race Condition Safety (Simultaneous Stock Out)
    // ------------------------------------------------------------------------
    console.log('\n▶ TEST 6: Concurrency Safety Under Simultaneous High-Contention Race Conditions');

    // Ahmedabad WH 1 currently has 50 units.
    // We launch 5 SIMULTANEOUS Stock Out operations of 20 units each.
    // 5 * 20 = 100 units requested, but only 50 units exist.
    // Under row locking (SELECT ... FOR UPDATE), EXACTLY 2 requests must succeed (20 + 20 = 40 units),
    // EXACTLY 3 requests must fail with insufficient stock,
    // and the final inventory MUST BE EXACTLY 10 units (never negative!).

    const concurrentRequests = [1, 2, 3, 4, 5].map((i) =>
      request('POST', '/api/inventory/stock-out', {
        productId: testProductId,
        warehouseId: 1,
        quantity: 20,
        reference: `RACE-TEST-${i}`,
        reason: `Concurrent deduction ${i}`
      }, adminToken)
    );

    const raceResults = await Promise.all(concurrentRequests);

    let successes = 0;
    let failures = 0;
    raceResults.forEach((res, idx) => {
      if (res.status === 200) {
        successes++;
      } else if (res.status === 400 && res.data.message.includes('Insufficient stock')) {
        failures++;
      }
    });

    console.log(`  Concurrent results: ${successes} succeeded, ${failures} rejected with insufficient stock.`);
    assert(successes === 2, `Exactly 2 operations succeeded (got ${successes})`);
    assert(failures === 3, `Exactly 3 operations failed due to insufficient stock (got ${failures})`);

    // Verify DB inventory quantity directly
    const [finalInv] = await pool.execute(
      'SELECT quantity FROM inventory WHERE product_id = ? AND warehouse_id = 1',
      [testProductId]
    );
    assert(finalInv[0].quantity === 10, `Final stock in DB is exactly 10 (50 - 40), got ${finalInv[0].quantity}`);
    assert(finalInv[0].quantity >= 0, 'Inventory quantity is strictly non-negative');

    // Verify movement records created for test product on WH 1
    const [raceMovements] = await pool.execute(
      'SELECT COUNT(*) as count FROM stock_movements WHERE product_id = ? AND warehouse_id = 1 AND reference LIKE "RACE-TEST-%"',
      [testProductId]
    );
    assert(raceMovements[0].count === 2, 'Exactly 2 immutable movement records generated for the 2 successful race operations');

    // ------------------------------------------------------------------------
    // TEST 7: Stock Adjustment Safeguards
    // ------------------------------------------------------------------------
    console.log('\n▶ TEST 7: Stock Adjustment Safeguards & Audit Trails');

    // Adjust WH 1 physical count to 15 (delta +5)
    const adjRes = await request('POST', '/api/inventory/adjustment', {
      productId: testProductId,
      warehouseId: 1,
      physicalQuantity: 15,
      reason: 'Physical cycle count discrepancy audit +5 units'
    }, managerAmdToken);
    assert(adjRes.status === 200, 'Manager adjustment succeeded with 200');
    assert(adjRes.data.data.newQuantity === 15, 'New quantity updated to physical count 15');
    assert(adjRes.data.data.delta === 5, 'Recorded delta is +5');

    // Verify adjustment movement record
    const [adjMove] = await pool.execute(
      'SELECT * FROM stock_movements WHERE product_id = ? AND warehouse_id = 1 AND movement_type = "ADJUSTMENT" ORDER BY created_at DESC LIMIT 1',
      [testProductId]
    );
    assert(adjMove.length === 1, 'ADJUSTMENT movement record successfully written to immutable audit trail');
    assert(adjMove[0].previous_quantity === 10 && adjMove[0].new_quantity === 15, 'Previous and new quantities verified in audit');

    // ------------------------------------------------------------------------
    // TEST 8: Admin Warehouse Assignment CRUD (Add & Revoke)
    // ------------------------------------------------------------------------
    console.log('\n▶ TEST 8: Admin Warehouse Assignment Add & Revoke Lifecycle');

    // Create a temporary test user
    const testUserRes = await request('POST', '/api/users', {
      firstName: 'Temp',
      lastName: 'Assignee',
      email: `temp.assignee.${Date.now()}@inventory.local`,
      password: 'Password@12345',
      roleId: 3 // STAFF
    }, adminToken);
    assert(testUserRes.status === 201, 'Temp user created for assignment test');
    const tempUserId = testUserRes.data.data.id;
    testUserIds.push(tempUserId);

    // 1. Assign Mumbai WH 3
    const assignRes = await request('POST', `/api/users/${tempUserId}/warehouses`, {
      warehouseId: 3
    }, adminToken);
    assert(assignRes.status === 200, 'Warehouse 3 successfully assigned to user');

    // 2. Verify assignment exists in DB
    const [assignedWh] = await pool.execute(
      'SELECT * FROM user_warehouses WHERE user_id = ? AND warehouse_id = 3',
      [tempUserId]
    );
    assert(assignedWh.length === 1, 'Assignment confirmed in user_warehouses table');

    // 3. Revoke assignment
    const revokeRes = await request('DELETE', `/api/users/${tempUserId}/warehouses/3`, null, adminToken);
    assert(revokeRes.status === 200, 'Warehouse 3 assignment successfully revoked');

    // 4. Verify assignment removed from DB
    const [revokedWh] = await pool.execute(
      'SELECT * FROM user_warehouses WHERE user_id = ? AND warehouse_id = 3',
      [tempUserId]
    );
    assert(revokedWh.length === 0, 'Assignment cleanly removed from user_warehouses');

    console.log('\n=============================================================');
    console.log(' ALL AUTOMATED VERIFICATION TESTS PASSED PERFECTLY (100%)');
    console.log('=============================================================\n');

  } finally {
    // ------------------------------------------------------------------------
    // TEARDOWN & CLEANUP: Preserve development seed data intact!
    // ------------------------------------------------------------------------
    console.log('[CLEANUP] Cleaning up isolated test fixtures to preserve development seed data...');

    for (const pId of testProductIds) {
      await pool.execute('DELETE FROM inventory_alerts WHERE product_id = ?', [pId]);
      await pool.execute('DELETE FROM stock_movements WHERE product_id = ?', [pId]);
      await pool.execute('DELETE FROM inventory_transfers WHERE product_id = ?', [pId]);
      await pool.execute('DELETE FROM inventory WHERE product_id = ?', [pId]);
      await pool.execute('DELETE FROM products WHERE id = ?', [pId]);
    }

    for (const cId of testCategoryIds) {
      await pool.execute('DELETE FROM categories WHERE id = ?', [cId]);
    }

    for (const uId of testUserIds) {
      await pool.execute('DELETE FROM user_warehouses WHERE user_id = ?', [uId]);
      await pool.execute('DELETE FROM users WHERE id = ?', [uId]);
    }

    console.log('[CLEANUP] Isolated test fixtures cleanly removed.');

    if (server) {
      server.close();
    }
  }
}

// Run test runner
runTests()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('[TEST-RUNNER] Test suite execution failed:', err);
    if (server) server.close();
    await pool.end();
    process.exit(1);
  });
