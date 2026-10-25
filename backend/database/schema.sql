-- ==============================================================================
-- STANDALONE INVENTORY MANAGEMENT SYSTEM — POSTGRESQL 17 SCHEMA
-- ==============================================================================

-- 1. Roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(30) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  first_name VARCHAR(60) NOT NULL,
  last_name VARCHAR(60) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  token_version INT NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 3. Warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(30) NOT NULL UNIQUE,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(60) NOT NULL,
  state VARCHAR(60) NOT NULL,
  country VARCHAR(60) NOT NULL DEFAULT 'India',
  pincode VARCHAR(20) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(30),
  email VARCHAR(120),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_warehouses_code ON warehouses(code);
CREATE INDEX IF NOT EXISTS idx_warehouses_status ON warehouses(status);

-- 4. User Warehouses (Multi-warehouse assignment)
CREATE TABLE IF NOT EXISTS user_warehouses (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  warehouse_id INT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_warehouse UNIQUE (user_id, warehouse_id)
);
CREATE INDEX IF NOT EXISTS idx_uw_user ON user_warehouses(user_id);
CREATE INDEX IF NOT EXISTS idx_uw_warehouse ON user_warehouses(warehouse_id);

-- 5. Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);

-- 6. Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  sku VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  unit VARCHAR(30) NOT NULL DEFAULT 'units',
  price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
  minimum_stock INT NOT NULL DEFAULT 10 CHECK (minimum_stock >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- 7. Inventory table (Per Product Per Warehouse)
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  warehouse_id INT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_product_warehouse UNIQUE (product_id, warehouse_id)
);
CREATE INDEX IF NOT EXISTS idx_inv_warehouse ON inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inv_product ON inventory(product_id);

-- 8. Stock Movements (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  warehouse_id INT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  movement_type VARCHAR(30) NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT')),
  quantity INT NOT NULL CHECK (quantity > 0),
  previous_quantity INT NOT NULL CHECK (previous_quantity >= 0),
  new_quantity INT NOT NULL CHECK (new_quantity >= 0),
  reference VARCHAR(100),
  reason TEXT NOT NULL,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sm_product_wh ON stock_movements(product_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_sm_movement_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_sm_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_sm_user ON stock_movements(user_id);

-- 9. Inventory Transfers table (Atomic Inter-Warehouse Transfers)
CREATE TABLE IF NOT EXISTS inventory_transfers (
  id SERIAL PRIMARY KEY,
  transfer_code VARCHAR(50) NOT NULL UNIQUE,
  source_warehouse_id INT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  destination_warehouse_id INT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED')),
  reference VARCHAR(100),
  reason TEXT,
  created_by INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_it_code ON inventory_transfers(transfer_code);
CREATE INDEX IF NOT EXISTS idx_it_source ON inventory_transfers(source_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_it_dest ON inventory_transfers(destination_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_it_created_at ON inventory_transfers(created_at);

-- 10. Inventory Alerts table (State Machine: LOW_STOCK, OUT_OF_STOCK, RESOLVED)
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  warehouse_id INT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  current_quantity INT NOT NULL,
  minimum_stock INT NOT NULL,
  alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN ('LOW_STOCK', 'OUT_OF_STOCK')),
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESOLVED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL DEFAULT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_alert ON inventory_alerts (product_id, warehouse_id) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_alerts_prod_wh_status ON inventory_alerts(product_id, warehouse_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_status_type ON inventory_alerts(status, alert_type);
