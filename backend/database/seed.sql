-- ==============================================================================
-- STANDALONE INVENTORY MANAGEMENT SYSTEM — SEED DATA (DEVELOPMENT ONLY)
-- ==============================================================================

-- 1. Insert Roles
INSERT INTO roles (id, name, description) VALUES
(1, 'ADMIN', 'System-wide administrator with full global privileges'),
(2, 'MANAGER', 'Warehouse manager with operational authority over assigned facilities'),
(3, 'STAFF', 'Operations staff with routine stock-in, stock-out and permitted transfer capabilities')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Insert Users
-- Passwords:
-- Admin: Admin@12345 ($2a$10$QkomfwiS.GgyG/vT1yuY8eo1WUNeh7csE.q0gVOG7InKHAfIH5cSy)
-- Manager: Manager@12345 ($2a$10$BJmX8n136v6gmF6C6OrcluxnMPZh/8J5vZMIQ8tEnl4FWQw5plvTO)
-- Staff: Staff@12345 ($2a$10$iDu1ee44bAGCBCR5c965euX9Z9g6wl7xQBCQrTYGlycilRssptF06)
INSERT INTO users (id, role_id, first_name, last_name, email, password_hash, token_version, status) VALUES
(1, 1, 'Super', 'Administrator', 'admin@inventory.local', '$2a$10$QkomfwiS.GgyG/vT1yuY8eo1WUNeh7csE.q0gVOG7InKHAfIH5cSy', 1, 'ACTIVE'),
(2, 2, 'Rohan', 'Shah', 'manager.ahmedabad@inventory.local', '$2a$10$BJmX8n136v6gmF6C6OrcluxnMPZh/8J5vZMIQ8tEnl4FWQw5plvTO', 1, 'ACTIVE'),
(3, 2, 'Priya', 'Mehta', 'manager.surat@inventory.local', '$2a$10$BJmX8n136v6gmF6C6OrcluxnMPZh/8J5vZMIQ8tEnl4FWQw5plvTO', 1, 'ACTIVE'),
(4, 2, 'Vikram', 'Malhotra', 'manager.multi@inventory.local', '$2a$10$BJmX8n136v6gmF6C6OrcluxnMPZh/8J5vZMIQ8tEnl4FWQw5plvTO', 1, 'ACTIVE'),
(5, 3, 'Aakash', 'Patel', 'staff.ahmedabad@inventory.local', '$2a$10$iDu1ee44bAGCBCR5c965euX9Z9g6wl7xQBCQrTYGlycilRssptF06', 1, 'ACTIVE'),
(6, 3, 'Neha', 'Desai', 'staff.multi@inventory.local', '$2a$10$iDu1ee44bAGCBCR5c965euX9Z9g6wl7xQBCQrTYGlycilRssptF06', 1, 'ACTIVE'),
(7, 3, 'Karan', 'Joshi', 'staff.inactive@inventory.local', '$2a$10$iDu1ee44bAGCBCR5c965euX9Z9g6wl7xQBCQrTYGlycilRssptF06', 1, 'INACTIVE')
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- 3. Insert Warehouses
INSERT INTO warehouses (id, name, code, address, city, state, country, pincode, contact_person, phone, email, status) VALUES
(1, 'Ahmedabad Central Depot', 'WH-AMD-01', 'Plot 42, GIDC Industrial Estate, Naroda', 'Ahmedabad', 'Gujarat', 'India', '382330', 'Rohan Shah', '+91 98765 43210', 'amd.depot@inventory.local', 'ACTIVE'),
(2, 'Surat Logistics Hub', 'WH-SUR-01', 'B-12 Diamond Park, Sachin GIDC', 'Surat', 'Gujarat', 'India', '394230', 'Priya Mehta', '+91 98765 43211', 'surat.hub@inventory.local', 'ACTIVE'),
(3, 'Mumbai Coastal Facility', 'WH-BOM-01', 'Warehouse 7, Kalamboli Warehousing Complex', 'Navi Mumbai', 'Maharashtra', 'India', '410218', 'Vikram Malhotra', '+91 98765 43212', 'mumbai.wh@inventory.local', 'ACTIVE'),
(4, 'Delhi North Terminal', 'WH-DEL-01', 'Sector 18, Transport Nagar, Okhla', 'New Delhi', 'Delhi', 'India', '110020', 'Rajesh Verma', '+91 98765 43213', 'delhi.wh@inventory.local', 'ACTIVE')
ON DUPLICATE KEY UPDATE code=VALUES(code);

-- 4. User Warehouse Assignments
-- Manager Ahmedabad -> WH 1
-- Manager Surat -> WH 2
-- Manager Multi -> WH 1 & WH 3
-- Staff Ahmedabad -> WH 1
-- Staff Multi -> WH 1 & WH 2
INSERT INTO user_warehouses (user_id, warehouse_id) VALUES
(2, 1),
(3, 2),
(4, 1),
(4, 3),
(5, 1),
(6, 1),
(6, 2)
ON DUPLICATE KEY UPDATE user_id=VALUES(user_id);

-- 5. Insert Categories
INSERT INTO categories (id, name, description, status) VALUES
(1, 'Industrial Electronics', 'Circuit boards, controllers, sensors, and power converters', 'ACTIVE'),
(2, 'Machinery Components', 'Bearings, gears, valves, hydraulic seals, and motors', 'ACTIVE'),
(3, 'Raw Materials', 'Aluminum extrusions, copper coils, steel sheets, and brass rods', 'ACTIVE'),
(4, 'Packaging & Logistics', 'Corrugated boxes, heavy duty pallets, and strapping tapes', 'ACTIVE'),
(5, 'Safety & PPE', 'Industrial safety helmets, respirators, protective gloves, and harnesses', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 6. Insert Products
INSERT INTO products (id, category_id, sku, name, description, unit, price, minimum_stock, status) VALUES
(1, 1, 'ELC-PLC-001', 'Programmable Logic Controller 24V DC', 'Industrial modular PLC with 16 digital inputs and 8 relay outputs', 'units', 14500.00, 15, 'ACTIVE'),
(2, 1, 'ELC-SNS-002', 'Inductive Proximity Sensor M12', 'Flush mount PNP normally open proximity switch', 'units', 850.00, 25, 'ACTIVE'),
(3, 1, 'ELC-PWR-003', 'Switched-Mode Power Supply 24V 10A', 'DIN-rail mounted industrial AC/DC power supply', 'units', 2200.00, 20, 'ACTIVE'),
(4, 2, 'MCH-BRG-101', 'Deep Groove Ball Bearing 6205-2RS', 'High precision chrome steel rubber sealed bearing', 'pcs', 320.00, 40, 'ACTIVE'),
(5, 2, 'MCH-VLV-102', 'High-Pressure Pneumatic Solenoid Valve', '5/2 way pneumatic solenoid control valve 1/4 inch BSP', 'pcs', 1750.00, 10, 'ACTIVE'),
(6, 2, 'MCH-MTR-103', 'Three-Phase Induction Motor 2HP', 'Foot mounted 4-pole electric motor 1440 RPM', 'units', 8900.00, 8, 'ACTIVE'),
(7, 3, 'RAW-ALU-201', 'Aluminum Extrusion Profile 40x40 T-Slot', 'Anodized 6063-T5 aluminum modular structural beam (3m)', 'bars', 1450.00, 30, 'ACTIVE'),
(8, 3, 'RAW-COP-202', 'Enameled Copper Winding Wire 18 SWG', 'Super enameled copper wire spool (5kg per roll)', 'rolls', 4600.00, 12, 'ACTIVE'),
(9, 4, 'PKG-BOX-301', 'Double Wall Corrugated Box 400x300x250', 'Heavy duty 5-ply export quality packaging shipping box', 'boxes', 65.00, 100, 'ACTIVE'),
(10, 4, 'PKG-PLT-302', 'Industrial HDPE Plastic Pallet 1200x1000', 'Four-way entry heavy racking grade plastic pallet', 'pcs', 1850.00, 25, 'ACTIVE'),
(11, 5, 'SAF-HLM-401', 'Industrial Safety Helmet with Ratchet', 'High density polyethylene protective hard hat (Yellow)', 'pcs', 280.00, 35, 'ACTIVE'),
(12, 5, 'SAF-GLV-402', 'Nitrile Coated Cut-Resistant Gloves (L)', 'Level 5 cut resistance breathable mechanical work gloves', 'pairs', 190.00, 50, 'ACTIVE')
ON DUPLICATE KEY UPDATE sku=VALUES(sku);

-- 7. Insert Initial Inventory Across Warehouses
INSERT INTO inventory (id, product_id, warehouse_id, quantity) VALUES
-- Ahmedabad WH 1
(1, 1, 1, 45),   -- PLC: healthy (min 15)
(2, 2, 1, 80),   -- Sensor: healthy (min 25)
(3, 3, 1, 12),   -- Power Supply: LOW STOCK (12 <= 20)
(4, 4, 1, 110),  -- Bearing: healthy (min 40)
(5, 5, 1, 0),    -- Valve: OUT OF STOCK (0)
(6, 6, 1, 15),   -- Motor: healthy (min 8)
(7, 7, 1, 60),   -- Aluminum: healthy (min 30)
(8, 8, 1, 18),   -- Copper: healthy (min 12)
(9, 9, 1, 240),  -- Box: healthy (min 100)
(10, 10, 1, 5),  -- Pallet: LOW STOCK (5 <= 25)
(11, 11, 1, 90), -- Helmet: healthy (min 35)
(12, 12, 1, 150),-- Glove: healthy (min 50)

-- Surat WH 2
(13, 1, 2, 20),  -- PLC: healthy (min 15)
(14, 2, 2, 15),  -- Sensor: LOW STOCK (15 <= 25)
(15, 3, 2, 25),  -- Power Supply: healthy (min 20)
(16, 4, 2, 0),   -- Bearing: OUT OF STOCK (0)
(17, 7, 2, 35),  -- Aluminum: healthy (min 30)
(18, 9, 2, 120), -- Box: healthy (min 100)
(19, 11, 2, 40), -- Helmet: healthy (min 35)

-- Mumbai WH 3
(20, 1, 3, 30),  -- PLC: healthy (min 15)
(21, 5, 3, 18),  -- Valve: healthy (min 10)
(22, 6, 3, 4),   -- Motor: LOW STOCK (4 <= 8)
(23, 8, 3, 25),  -- Copper: healthy (min 12)
(24, 10, 3, 40), -- Pallet: healthy (min 25)

-- Delhi WH 4
(25, 2, 4, 60),  -- Sensor: healthy (min 25)
(26, 4, 4, 85),  -- Bearing: healthy (min 40)
(27, 7, 4, 50),  -- Aluminum: healthy (min 30)
(28, 11, 4, 75)  -- Helmet: healthy (min 35)
ON DUPLICATE KEY UPDATE quantity=VALUES(quantity);

-- 8. Insert Initial Stock Movements (Audit Trail baseline)
INSERT INTO stock_movements (product_id, warehouse_id, movement_type, quantity, previous_quantity, new_quantity, reference, reason, user_id, created_at) VALUES
(1, 1, 'IN', 45, 0, 45, 'PO-2026-0801', 'Initial warehouse stock onboarding from vendor', 1, NOW() - INTERVAL 10 DAY),
(2, 1, 'IN', 80, 0, 80, 'PO-2026-0802', 'Initial warehouse stock onboarding from vendor', 1, NOW() - INTERVAL 10 DAY),
(3, 1, 'IN', 30, 0, 30, 'PO-2026-0803', 'Initial batch receipt', 2, NOW() - INTERVAL 8 DAY),
(3, 1, 'OUT', 18, 30, 12, 'DISP-0811', 'Dispatched for assembly line integration', 5, NOW() - INTERVAL 3 DAY),
(5, 1, 'IN', 15, 0, 15, 'PO-2026-0805', 'Vendor delivery receipt', 2, NOW() - INTERVAL 9 DAY),
(5, 1, 'OUT', 15, 15, 0, 'DISP-0820', 'Urgent client fulfillment order', 5, NOW() - INTERVAL 1 DAY),
(10, 1, 'IN', 25, 0, 25, 'PO-2026-0810', 'Pallet intake from logistics supplier', 1, NOW() - INTERVAL 7 DAY),
(10, 1, 'OUT', 20, 25, 5, 'DISP-0825', 'Heavy shipment staging usage', 5, NOW() - INTERVAL 2 DAY),
(2, 2, 'IN', 40, 0, 40, 'PO-2026-0812', 'Initial stock intake', 3, NOW() - INTERVAL 6 DAY),
(2, 2, 'OUT', 25, 40, 15, 'DISP-0830', 'Dispatched to textile machinery line', 6, NOW() - INTERVAL 2 DAY),
(4, 2, 'IN', 20, 0, 20, 'PO-2026-0814', 'Intake bearing batch', 3, NOW() - INTERVAL 5 DAY),
(4, 2, 'OUT', 20, 20, 0, 'DISP-0835', 'Maintenance overhaul release', 6, NOW() - INTERVAL 1 DAY),
(6, 3, 'IN', 10, 0, 10, 'PO-2026-0816', 'Intake motors batch', 4, NOW() - INTERVAL 6 DAY),
(6, 3, 'OUT', 6, 10, 4, 'DISP-0840', 'Dispatched for conveyor installation', 4, NOW() - INTERVAL 1 DAY);

-- 9. Insert Initial Active Inventory Alerts (synchronized with above quantities)
INSERT INTO inventory_alerts (product_id, warehouse_id, current_quantity, minimum_stock, alert_type, status, created_at) VALUES
(3, 1, 12, 20, 'LOW_STOCK', 'ACTIVE', NOW() - INTERVAL 3 DAY),
(5, 1, 0, 10, 'OUT_OF_STOCK', 'ACTIVE', NOW() - INTERVAL 1 DAY),
(10, 1, 5, 25, 'LOW_STOCK', 'ACTIVE', NOW() - INTERVAL 2 DAY),
(2, 2, 15, 25, 'LOW_STOCK', 'ACTIVE', NOW() - INTERVAL 2 DAY),
(4, 2, 0, 40, 'OUT_OF_STOCK', 'ACTIVE', NOW() - INTERVAL 1 DAY),
(6, 3, 4, 8, 'LOW_STOCK', 'ACTIVE', NOW() - INTERVAL 1 DAY)
ON DUPLICATE KEY UPDATE current_quantity=VALUES(current_quantity);
