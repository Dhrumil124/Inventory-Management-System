-- ==============================================================================
-- STANDALONE INVENTORY MANAGEMENT SYSTEM — SEED DATA (POSTGRESQL 17)
-- ==============================================================================

TRUNCATE TABLE inventory_alerts, stock_movements, inventory_transfers, inventory, user_warehouses, products, categories, warehouses, users, roles RESTART IDENTITY CASCADE;

-- 1. Insert Roles
INSERT INTO roles (id, name, description) VALUES
(1, 'ADMIN', 'System-wide administrator with full global privileges'),
(2, 'MANAGER', 'Warehouse manager with operational authority over assigned facilities'),
(3, 'STAFF', 'Operations staff with routine stock-in, stock-out and permitted transfer capabilities')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description;

-- 2. Insert Users
-- Passwords:
-- Admin: Admin@12345
-- Manager: Manager@12345
-- Staff: Staff@12345
INSERT INTO users (id, role_id, first_name, last_name, email, password_hash, token_version, status) VALUES
(1, 1, 'Super', 'Administrator', 'admin@inventory.local', '$2a$10$QkomfwiS.GgyG/vT1yuY8eo1WUNeh7csE.q0gVOG7InKHAfIH5cSy', 1, 'ACTIVE'),
(2, 2, 'Rohan', 'Shah', 'manager.ahmedabad@inventory.local', '$2a$10$BJmX8n136v6gmF6C6OrcluxnMPZh/8J5vZMIQ8tEnl4FWQw5plvTO', 1, 'ACTIVE'),
(3, 2, 'Priya', 'Mehta', 'manager.surat@inventory.local', '$2a$10$BJmX8n136v6gmF6C6OrcluxnMPZh/8J5vZMIQ8tEnl4FWQw5plvTO', 1, 'ACTIVE'),
(4, 2, 'Vikram', 'Malhotra', 'manager.multi@inventory.local', '$2a$10$BJmX8n136v6gmF6C6OrcluxnMPZh/8J5vZMIQ8tEnl4FWQw5plvTO', 1, 'ACTIVE'),
(5, 3, 'Aakash', 'Patel', 'staff.ahmedabad@inventory.local', '$2a$10$iDu1ee44bAGCBCR5c965euX9Z9g6wl7xQBCQrTYGlycilRssptF06', 1, 'ACTIVE'),
(6, 3, 'Neha', 'Desai', 'staff.multi@inventory.local', '$2a$10$iDu1ee44bAGCBCR5c965euX9Z9g6wl7xQBCQrTYGlycilRssptF06', 1, 'ACTIVE'),
(7, 3, 'Karan', 'Joshi', 'staff.inactive@inventory.local', '$2a$10$iDu1ee44bAGCBCR5c965euX9Z9g6wl7xQBCQrTYGlycilRssptF06', 1, 'INACTIVE')
ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email, role_id=EXCLUDED.role_id, first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name, password_hash=EXCLUDED.password_hash, status=EXCLUDED.status;

-- 3. Insert Warehouses
INSERT INTO warehouses (id, name, code, address, city, state, country, pincode, contact_person, phone, email, status) VALUES
(1, 'Ahmedabad Central Depot', 'WH-AMD-01', 'Plot 42, GIDC Industrial Estate, Naroda', 'Ahmedabad', 'Gujarat', 'India', '382330', 'Rohan Shah', '+91 98765 43210', 'amd.depot@inventory.local', 'ACTIVE'),
(2, 'Surat Logistics Hub', 'WH-SUR-01', 'B-12 Diamond Park, Sachin GIDC', 'Surat', 'Gujarat', 'India', '394230', 'Priya Mehta', '+91 98765 43211', 'surat.hub@inventory.local', 'ACTIVE'),
(3, 'Mumbai Coastal Facility', 'WH-BOM-01', 'Warehouse 7, Kalamboli Warehousing Complex', 'Navi Mumbai', 'Maharashtra', 'India', '410218', 'Vikram Malhotra', '+91 98765 43212', 'mumbai.wh@inventory.local', 'ACTIVE'),
(4, 'Delhi North Terminal', 'WH-DEL-01', 'Sector 18, Transport Nagar, Okhla', 'New Delhi', 'Delhi', 'India', '110020', 'Rajesh Verma', '+91 98765 43213', 'delhi.wh@inventory.local', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET code=EXCLUDED.code, name=EXCLUDED.name, address=EXCLUDED.address, city=EXCLUDED.city, state=EXCLUDED.state, pincode=EXCLUDED.pincode, status=EXCLUDED.status;

-- 4. User Warehouse Assignments
INSERT INTO user_warehouses (user_id, warehouse_id) VALUES
(2, 1),
(3, 2),
(4, 1),
(4, 3),
(5, 1),
(6, 1),
(6, 2)
ON CONFLICT (user_id, warehouse_id) DO NOTHING;

-- 5. Insert Categories
INSERT INTO categories (id, name, description, status) VALUES
(1, 'Consumer Electronics', 'Smart TVs, sound systems, home theatre, and audio accessories', 'ACTIVE'),
(2, 'Home Appliances', 'Refrigerators, washing machines, air conditioners, and coolers', 'ACTIVE'),
(3, 'Computing', 'Laptops, desktops, monitors, keyboards, mice, and networking devices', 'ACTIVE'),
(4, 'Mobile & Accessories', 'Smartphones, tablets, power banks, earbuds, and chargers', 'ACTIVE'),
(5, 'Kitchen Appliances', 'Mixer grinders, electric kettles, toasters, and air fryers', 'ACTIVE'),
(6, 'Furniture & Office', 'Ergonomic chairs, computer desks, bookshelves, and cabinets', 'ACTIVE'),
(7, 'General & Electrical', 'LED lighting, extension boards, batteries, and CCTV cameras', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, status=EXCLUDED.status;

-- 6. Insert Products
INSERT INTO products (id, category_id, sku, name, description, unit, price, minimum_stock, status) VALUES
(1, 1, 'ELEC-TV-55', 'Ultra HD 4K Smart LED TV 55"', '55-inch HDR10+ Dolby Vision Smart TV with Google TV OS', 'units', 42999.00, 8, 'ACTIVE'),
(2, 1, 'ELEC-SND-300', 'Dolby Atmos Soundbar 300W with Subwoofer', 'Wireless subwoofer, Bluetooth 5.3, HDMI eARC surround soundbar', 'units', 12499.00, 12, 'ACTIVE'),
(3, 1, 'ELEC-SPK-001', 'Portable Waterproof Bluetooth Speaker', 'IPX7 water-resistant 24W stereo portable speaker with 16h battery', 'units', 3499.00, 20, 'ACTIVE'),
(4, 1, 'ELEC-HT-501', '5.1 Channel Home Theatre System', '1000W surround sound system with rear satellite speakers', 'units', 21999.00, 6, 'ACTIVE'),
(5, 2, 'APP-REF-340', 'Double Door Inverter Refrigerator 340L', 'Frost-free convertible 3-star smart inverter refrigerator', 'units', 32490.00, 6, 'ACTIVE'),
(6, 2, 'APP-WSH-008', 'Front Load Washing Machine 8kg', 'Inverter direct drive 1400 RPM with steam wash and allergy care', 'units', 28990.00, 5, 'ACTIVE'),
(7, 2, 'APP-MWO-028', 'Convection Microwave Oven 28L', 'Stainless steel cavity with auto-cook menu and motorized rotisserie', 'units', 11490.00, 10, 'ACTIVE'),
(8, 2, 'APP-AC-150', 'Inverter Split Air Conditioner 1.5 Ton', '5-star energy rated copper condenser with PM 2.5 air filter', 'units', 36990.00, 8, 'ACTIVE'),
(9, 2, 'APP-CLR-070', 'Desert Air Cooler 70L', 'High air delivery honeycomb cooling pads with ice chamber', 'units', 8490.00, 10, 'ACTIVE'),
(10, 2, 'APP-VAC-101', 'Robotic Vacuum & Mop Cleaner', 'Laser LiDAR navigation with 4000Pa suction power and app control', 'units', 18999.00, 8, 'ACTIVE'),
(11, 3, 'CMP-LAP-14', 'Thin & Light Ultrabook Laptop 14"', 'Intel Core i5 13th Gen, 16GB RAM, 512GB NVMe SSD, FHD IPS display', 'units', 54990.00, 10, 'ACTIVE'),
(12, 3, 'CMP-AIO-24', 'All-in-One Desktop PC 24"', '23.8-inch FHD, Core i5, 16GB RAM, 1TB SSD with wireless keyboard & mouse', 'units', 46990.00, 6, 'ACTIVE'),
(13, 3, 'CMP-MON-27', '27" IPS QHD Frameless Monitor', '2560x1440 resolution, 100Hz refresh rate, 99% sRGB color gamut', 'units', 17499.00, 12, 'ACTIVE'),
(14, 3, 'CMP-KEY-001', 'Mechanical Wireless Keyboard RGB', 'Hot-swappable red switches with tri-mode Bluetooth/2.4G connectivity', 'units', 3299.00, 25, 'ACTIVE'),
(15, 3, 'CMP-MOU-002', 'Ergonomic Wireless Optical Mouse', 'Rechargeable 2.4GHz silent click mouse with adjustable DPI', 'units', 899.00, 30, 'ACTIVE'),
(16, 3, 'CMP-PRN-101', 'Multi-Function All-in-One Laser Printer', 'Print, scan, copy with auto-duplexing and Wi-Fi Direct network support', 'units', 14299.00, 8, 'ACTIVE'),
(17, 3, 'CMP-RTR-006', 'Gigabit Dual-Band Wi-Fi 6 Router', 'AX3000 speeds with 4 high-gain antennas and WPA3 security', 'units', 2999.00, 20, 'ACTIVE'),
(18, 4, 'MOB-PHN-128', '5G Smartphone 128GB Storage', '6.7-inch 120Hz AMOLED, 50MP OIS camera, 5000mAh battery 67W charging', 'units', 19999.00, 15, 'ACTIVE'),
(19, 4, 'MOB-TAB-104', '10.4" Android Tablet 64GB Wi-Fi', '2K display, quad stereo speakers, 7100mAh battery with stylus support', 'units', 15499.00, 10, 'ACTIVE'),
(20, 4, 'MOB-PB-200', '20000mAh Fast Charging Power Bank', '22.5W two-way fast charge with dual USB-A and Type-C Power Delivery', 'units', 1799.00, 35, 'ACTIVE'),
(21, 4, 'MOB-EBD-ANC', 'Active Noise Cancelling Wireless Earbuds', '35dB hybrid ANC, 30 hours playback, low latency gaming mode', 'pairs', 2999.00, 25, 'ACTIVE'),
(22, 4, 'MOB-WAT-AML', 'Smartwatch with AMOLED Display & SpO2', '1.43-inch display, Bluetooth calling, heart rate & sleep monitoring', 'units', 3999.00, 20, 'ACTIVE'),
(23, 4, 'MOB-CHG-65W', '65W GaN Dual-Port USB-C Wall Charger', 'Ultra-compact Gallium Nitride adapter for laptops, tablets, and phones', 'units', 1499.00, 30, 'ACTIVE'),
(24, 5, 'KIT-MIX-750', '750W Heavy Duty Mixer Grinder 3-Jar', 'Pure copper motor with 3 stainless steel leak-proof jars', 'units', 3299.00, 15, 'ACTIVE'),
(25, 5, 'KIT-KET-180', '1.8L Stainless Steel Electric Kettle', '1500W rapid boil with auto shut-off and boil-dry protection', 'units', 1199.00, 25, 'ACTIVE'),
(26, 5, 'KIT-TST-002', '2-Slice Automatic Pop-Up Toaster', '7 browning controls with defrost, reheat, and cancel functions', 'units', 1499.00, 18, 'ACTIVE'),
(27, 5, 'KIT-IND-200', '2000W Touch Control Induction Cooktop', 'Preset Indian cooking menus with crystal glass top and timer', 'units', 2699.00, 12, 'ACTIVE'),
(28, 5, 'KIT-AF-450', 'Digital Air Fryer 4.5L with Rapid Air', '8 preset programs, 360-degree rapid heat circulation, non-stick basket', 'units', 5499.00, 10, 'ACTIVE'),
(29, 5, 'KIT-COF-015', 'Espresso & Cappuccino 15-Bar Coffee Maker', 'High pressure Italian pump with milk frother wand for lattes & espresso', 'units', 7999.00, 8, 'ACTIVE'),
(30, 6, 'FUR-CHR-001', 'High-Back Ergonomic Mesh Office Chair', 'Adjustable lumbar support, 2D armrests, and synchro-tilt mechanism', 'units', 7499.00, 12, 'ACTIVE'),
(31, 6, 'FUR-DSK-002', 'Solid Wood Engineered Computer Desk', 'Spacious workspace with cable management tray and storage drawer', 'units', 6299.00, 8, 'ACTIVE'),
(32, 6, 'FUR-BSH-004', '4-Tier Modern Bookshelf & Display Rack', 'Heavy-duty steel frame with rust-proof coating and wood shelves', 'units', 3899.00, 10, 'ACTIVE'),
(33, 7, 'GEN-LED-009', 'Cool Day Light 9W LED Bulbs (Pack of 4)', 'B22 base energy-saving LED bulbs with surge protection 4kV', 'packs', 349.00, 50, 'ACTIVE'),
(34, 7, 'GEN-EXT-006', '6-Socket Surge Protector Extension Board', 'Individual switches with LED indicators and 2-meter heavy copper cord', 'units', 699.00, 30, 'ACTIVE'),
(35, 7, 'GEN-CAM-108', 'Smart 1080p Wi-Fi CCTV Security Camera', '360-degree pan-tilt with infrared night vision and motion tracking', 'units', 2199.00, 15, 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET category_id=EXCLUDED.category_id, sku=EXCLUDED.sku, name=EXCLUDED.name, description=EXCLUDED.description, unit=EXCLUDED.unit, price=EXCLUDED.price, minimum_stock=EXCLUDED.minimum_stock, status=EXCLUDED.status;

-- 7. Insert Initial Inventory Across All 4 Warehouses
INSERT INTO inventory (id, product_id, warehouse_id, quantity) VALUES
(1, 1, 1, 24),
(2, 2, 1, 35),
(3, 3, 1, 8),
(4, 5, 1, 18),
(5, 6, 1, 0),
(6, 7, 1, 25),
(7, 11, 1, 30),
(8, 14, 1, 12),
(9, 15, 1, 90),
(10, 18, 1, 45),
(11, 20, 1, 100),
(12, 24, 1, 40),
(13, 25, 1, 5),
(14, 30, 1, 25),
(15, 33, 1, 150),
(16, 35, 1, 35),
(17, 1, 2, 15),
(18, 4, 2, 2),
(19, 8, 2, 20),
(20, 9, 2, 0),
(21, 11, 2, 18),
(22, 13, 2, 22),
(23, 17, 2, 45),
(24, 18, 2, 28),
(25, 21, 2, 8),
(26, 26, 2, 30),
(27, 28, 2, 16),
(28, 34, 2, 70),
(29, 2, 3, 20),
(30, 5, 3, 14),
(31, 6, 3, 12),
(32, 10, 3, 3),
(33, 12, 3, 15),
(34, 16, 3, 0),
(35, 19, 3, 25),
(36, 22, 3, 40),
(37, 23, 3, 60),
(38, 27, 3, 28),
(39, 29, 3, 10),
(40, 31, 3, 16),
(41, 32, 3, 22),
(42, 1, 4, 12),
(43, 7, 4, 18),
(44, 8, 4, 15),
(45, 11, 4, 22),
(46, 13, 4, 0),
(47, 14, 4, 40),
(48, 18, 4, 30),
(49, 20, 4, 12),
(50, 24, 4, 25),
(51, 30, 4, 18),
(52, 33, 4, 120),
(53, 35, 4, 28)
ON CONFLICT (product_id, warehouse_id) DO UPDATE SET quantity=EXCLUDED.quantity;

-- 8. Insert Initial Stock Movements
INSERT INTO stock_movements (product_id, warehouse_id, movement_type, quantity, previous_quantity, new_quantity, reference, reason, user_id, created_at) VALUES
(1, 1, 'IN', 24, 0, 24, 'PO-2026-0901', 'Initial consignment delivery from Sony Electronics', 1, NOW() - INTERVAL '10 day'),
(3, 1, 'IN', 25, 0, 25, 'PO-2026-0902', 'Vendor batch receipt from JBL India', 2, NOW() - INTERVAL '8 day'),
(3, 1, 'OUT', 17, 25, 8, 'DISP-0905', 'Bulk retail dispatch to Naroda lifestyle store', 5, NOW() - INTERVAL '3 day'),
(6, 1, 'IN', 10, 0, 10, 'PO-2026-0903', 'Initial batch intake from LG Electronics', 2, NOW() - INTERVAL '9 day'),
(6, 1, 'OUT', 10, 10, 0, 'DISP-0910', 'Urgent institutional order fulfillment', 5, NOW() - INTERVAL '1 day'),
(14, 1, 'IN', 30, 0, 30, 'PO-2026-0904', 'Intake Keychron mechanical keyboards', 2, NOW() - INTERVAL '7 day'),
(14, 1, 'OUT', 18, 30, 12, 'DISP-0912', 'Corporate office procurement dispatch', 5, NOW() - INTERVAL '2 day'),
(4, 2, 'IN', 10, 0, 10, 'PO-2026-0906', 'Receipt from Samsung Audio division', 3, NOW() - INTERVAL '6 day'),
(4, 2, 'OUT', 8, 10, 2, 'DISP-0915', 'Store replenishment dispatch', 6, NOW() - INTERVAL '2 day'),
(9, 2, 'IN', 15, 0, 15, 'PO-2026-0907', 'Symphony desert cooler seasonal intake', 3, NOW() - INTERVAL '5 day'),
(9, 2, 'OUT', 15, 15, 0, 'DISP-0918', 'High summer demand clearance dispatch', 6, NOW() - INTERVAL '1 day'),
(10, 3, 'IN', 12, 0, 12, 'PO-2026-0908', 'Dreame robotic cleaner shipment', 4, NOW() - INTERVAL '6 day'),
(10, 3, 'OUT', 9, 12, 3, 'DISP-0922', 'Online festive order fulfillments', 4, NOW() - INTERVAL '1 day'),
(16, 3, 'IN', 8, 0, 8, 'PO-2026-0909', 'HP laser printer batch intake', 4, NOW() - INTERVAL '7 day'),
(16, 3, 'OUT', 8, 8, 0, 'DISP-0925', 'Commercial client setup order dispatch', 4, NOW() - INTERVAL '2 day'),
(13, 4, 'IN', 15, 0, 15, 'PO-2026-0911', 'Dell QHD monitors intake', 1, NOW() - INTERVAL '8 day'),
(13, 4, 'OUT', 15, 15, 0, 'DISP-0928', 'Direct enterprise dispatch to cyber hub', 1, NOW() - INTERVAL '1 day'),
(20, 4, 'IN', 40, 0, 40, 'PO-2026-0913', 'Mi power bank bulk receipt', 1, NOW() - INTERVAL '5 day'),
(20, 4, 'OUT', 28, 40, 12, 'DISP-0930', 'Retail counter replenishment dispatch', 1, NOW() - INTERVAL '2 day');

-- 9. Insert Initial Active Inventory Alerts
INSERT INTO inventory_alerts (product_id, warehouse_id, current_quantity, minimum_stock, alert_type, status, created_at) VALUES
(3, 1, 8, 20, 'LOW_STOCK', 'ACTIVE', NOW() - INTERVAL '3 day'),
(6, 1, 0, 5, 'OUT_OF_STOCK', 'ACTIVE', NOW() - INTERVAL '1 day'),
(14, 1, 12, 25, 'LOW_STOCK', 'ACTIVE', NOW() - INTERVAL '2 day'),
(25, 1, 5, 25, 'LOW_STOCK', 'ACTIVE', NOW() - INTERVAL '2 day'),
(4, 2, 2, 6, 'LOW_STOCK', 'ACTIVE', NOW() - INTERVAL '2 day'),
(9, 2, 0, 10, 'OUT_OF_STOCK', 'ACTIVE', NOW() - INTERVAL '1 day'),
(21, 2, 8, 25, 'LOW_STOCK', 'ACTIVE', NOW() - INTERVAL '2 day'),
(10, 3, 3, 8, 'LOW_STOCK', 'ACTIVE', NOW() - INTERVAL '1 day'),
(16, 3, 0, 8, 'OUT_OF_STOCK', 'ACTIVE', NOW() - INTERVAL '2 day'),
(13, 4, 0, 12, 'OUT_OF_STOCK', 'ACTIVE', NOW() - INTERVAL '1 day'),
(20, 4, 12, 35, 'LOW_STOCK', 'ACTIVE', NOW() - INTERVAL '2 day')
ON CONFLICT (id) DO UPDATE SET current_quantity=EXCLUDED.current_quantity, minimum_stock=EXCLUDED.minimum_stock, alert_type=EXCLUDED.alert_type, status=EXCLUDED.status;

-- 10. Update Serial Sequences to match max IDs
SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE(MAX(id), 1)) FROM roles;
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1)) FROM users;
SELECT setval(pg_get_serial_sequence('warehouses', 'id'), COALESCE(MAX(id), 1)) FROM warehouses;
SELECT setval(pg_get_serial_sequence('user_warehouses', 'id'), COALESCE(MAX(id), 1)) FROM user_warehouses;
SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE(MAX(id), 1)) FROM categories;
SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE(MAX(id), 1)) FROM products;
SELECT setval(pg_get_serial_sequence('inventory', 'id'), COALESCE(MAX(id), 1)) FROM inventory;
SELECT setval(pg_get_serial_sequence('stock_movements', 'id'), COALESCE(MAX(id), 1)) FROM stock_movements;
SELECT setval(pg_get_serial_sequence('inventory_transfers', 'id'), COALESCE(MAX(id), 1)) FROM inventory_transfers;
SELECT setval(pg_get_serial_sequence('inventory_alerts', 'id'), COALESCE(MAX(id), 1)) FROM inventory_alerts;
