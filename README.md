# Standalone Multi-Warehouse Inventory Management System

A production-grade, secure, auditable, and standalone **Multi-Warehouse Inventory Management System** built from scratch with **Node.js/Express**, **MySQL 8.0 (InnoDB)**, and **React + Vite + Tailwind CSS**.

This application is completely independent and self-contained. It features strict role-based access control (RBAC), multi-warehouse access isolation, deterministic two-row locking for deadlock-free concurrent transfers, automated state-machine alerts, immutable audit logging, and a tailored professional SaaS user experience.

---

## Architecture & System Overview

```text
inventory-management-system/
│
├── backend/
│   ├── config/             # DB connection pool, environment configuration
│   ├── database/           # schema.sql, seed.sql, initDb.js runner
│   ├── middleware/         # auth (token_version), checkRole, checkWarehouseAccess, rateLimiter, errorHandler, validator
│   ├── controllers/        # auth, users, warehouses, categories, products, inventory, history, alerts, dashboard
│   ├── services/           # inventoryService (row locking, atomic transactions, alert state machine)
│   ├── validators/         # schemas for inputs, quantities, IDs, passwords
│   ├── routes/             # REST endpoints mounted under /api
│   ├── utils/              # responseFormatter, constants
│   ├── tests/              # isolated automated test suite (api_verification.js)
│   ├── app.js              # Express app with Helmet, CORS, and rate limiting
│   ├── server.js           # Server bootstrap & graceful shutdown handler
│   ├── package.json
│   └── .env.example        # Environment variable template
│
├── frontend/
│   ├── src/
│   │   ├── components/     # UI kit: Button, Input, Select, Modal, ConfirmDialog, Table, Badge, Card, StatCard
│   │   ├── context/        # AuthContext (session, token invalidation, role helpers, warehouse scope)
│   │   ├── layouts/        # AppLayout (collapsible sidebar, header, mobile drawer) & AuthLayout
│   │   ├── pages/          # 15 functional application views
│   │   ├── routes/         # AppRoutes, ProtectedRoute (RBAC + Auth guard)
│   │   ├── services/       # Centralized Axios client with automatic Bearer token injection & 401 interceptor
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css       # Design tokens, custom scrollbars, typography
│   ├── vite.config.js      # Vite dev server with /api proxy
│   ├── tailwind.config.js  # Forest Emerald theme, custom shadows & surfaces
│   ├── package.json
│   └── index.html
│
├── .gitignore
├── .env.example
└── README.md
```

---

## Core Capabilities & Architectural Safeguards

1. **Strict Multi-Warehouse Authorization & Anti-Tampering**:
   - Centralized authentication system mapping users to one or multiple warehouses via `user_warehouses`.
   - **Never trusts frontend warehouse IDs**: Every warehouse-sensitive endpoint independently validates user permissions in the database. Changing a `warehouseId` in the request body immediately triggers a `403 Forbidden`.
   - **Staff Transfer Safeguard**: A `STAFF` user may transfer stock **only when BOTH** the source warehouse and destination warehouse are explicitly assigned to that user.
   - **Manager Adjustment Safeguard**: Managers can only adjust stock within their assigned warehouses with mandatory audit justification and non-negative quantity validation.

2. **ACID Transactions & Concurrency Safety**:
   - All inventory mutations (`Stock In`, `Stock Out`, `Transfer`, `Adjustment`) run inside database transactions (`START TRANSACTION ... COMMIT`).
   - Row-level locking (`SELECT ... FOR UPDATE`) prevents race conditions, lost updates, and negative inventory under simultaneous high-contention traffic.
   - **Deterministic Lock Ordering**: Stock transfers lock both source and destination rows ordered by `warehouse_id ASC`, mathematically preventing deadlock under concurrent reciprocal transfers.

3. **Zero Arbitrary Inventory Overwrites**:
   - No general `PUT /inventory/:id` endpoint exists. Inventory quantities change strictly through audited business events (`IN`, `OUT`, `TRANSFER_IN`, `TRANSFER_OUT`, `ADJUSTMENT`).

4. **Alert State Machine & Deduplication**:
   - `quantity == 0` &rarr; `OUT_OF_STOCK`
   - `0 < quantity <= minimum_stock` &rarr; `LOW_STOCK`
   - `quantity > minimum_stock` &rarr; `RESOLVED`
   - Backed by an active-status uniqueness constraint (`UNIQUE KEY uq_active_alert (product_id, warehouse_id, active_status)`), guaranteeing zero duplicate active alerts even under high concurrent load.

5. **Token Lifecycle & Session Revocation**:
   - Every user record maintains a `token_version` integer.
   - Calling `/api/auth/logout`, updating account password, or deactivating an employee account immediately increments `token_version`, instantly invalidating all active JWT tokens across all devices.

6. **Historical Data Preservation**:
   - No hard-deletes of entities tied to audit history. Categories with products, products with movements, and warehouses with inventory are deactivated (`status = 'INACTIVE'`), preserving relational integrity.
   - Stock movements and completed transfers are immutable and cannot be edited or deleted.

---

## Prerequisites

- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later
- **MySQL Server**: 8.0 or later (InnoDB engine enabled)

---

## Environment Variables Configuration

Copy `.env.example` in `backend/` to `.env`:

```bash
cp backend/.env.example backend/.env
```

Configure your local database credentials in `backend/.env`:

```env
PORT=5000
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=inventory_db
DB_USER=root
DB_PASSWORD=your_mysql_password_here

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=24h

# Security & CORS
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=500
AUTH_RATE_LIMIT_MAX=15
```

> **Security Note:** `.env` files are ignored in `.gitignore` and must never be committed to Git.

---

## Database Initialization & Seed Data

Run the automated database runner from `backend/`:

```bash
cd backend
npm run db:init
```

This script:
1. Connects to MySQL server.
2. Creates the database `inventory_db` with `utf8mb4` encoding if not existing.
3. Applies `schema.sql` (10 tables, check constraints, foreign keys, unique composite indexes).
4. Populates `seed.sql` (roles, seed warehouses, categories, products, initial inventory, and audit movements).

---

## Development Seed Credentials

> ⚠️ **LOCAL DEVELOPMENT / TESTING ONLY**  
> These credentials are generated strictly for testing the seed database locally. Never use these in a production environment.

| Role | Email Address | Password | Assigned Facilities |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@inventory.local` | `Admin@12345` | Global Access (All Warehouses) |
| **MANAGER** | `manager.ahmedabad@inventory.local` | `Manager@12345` | Ahmedabad Central Depot (WH 1) |
| **MANAGER** | `manager.surat@inventory.local` | `Manager@12345` | Surat Logistics Hub (WH 2) |
| **MANAGER** | `manager.multi@inventory.local` | `Manager@12345` | Ahmedabad (WH 1) & Mumbai (WH 3) |
| **STAFF** | `staff.ahmedabad@inventory.local` | `Staff@12345` | Ahmedabad Central Depot (WH 1) |
| **STAFF** | `staff.multi@inventory.local` | `Staff@12345` | Ahmedabad (WH 1) & Surat (WH 2) |
| **INACTIVE** | `staff.inactive@inventory.local` | `Staff@12345` | Deactivated (Rejects with 403) |

---

## Running the Application Locally

### 1. Start the Backend API Server

```bash
cd backend
npm run dev
```

- Server listens at: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

### 2. Start the Frontend Application

In a new terminal:

```bash
cd frontend
npm run dev
```

- Vite dev server runs at: `http://localhost:5173`
- Open your browser to `http://localhost:5173/login`

### 3. Production Frontend Build

To validate the frontend production bundle:

```bash
cd frontend
npm run build
```

---

## Running the Automated Test Suite

The project includes an isolated automated test runner that verifies authentication, RBAC, warehouse isolation, race condition safety, and alert state transitions without corrupting seed data:

```bash
cd backend
npm run test:api
```

### Verified Test Cases (100% Pass):
1. **Authentication & Token Lifecycle**:
   - Admin login & profile verification (`200 OK`)
   - Invalid password rejection (`401 Unauthorized`)
   - Deactivated account rejection (`403 Forbidden`)
   - Logout session invalidation (`token_version` revocation)
2. **Role & Warehouse Authorization Enforcement**:
   - Staff blocked from product creation (`403 Forbidden`)
   - Manager blocked from unassigned warehouse access (`403 Forbidden`)
   - Staff blocked from stock adjustments (`403 Forbidden`)
   - Staff transfer to unassigned destination warehouse rejected (`403 Forbidden`)
3. **Transactional Stock Operations**:
   - Zero or negative quantity rejection (`400 Bad Request`)
   - Stock Out overdraft rejection (`400 Bad Request`)
   - Atomic Stock In and Stock Out quantity tracking
4. **Deterministic Transfer Locking**:
   - Dual-row lock acquisition in deterministic order (`ORDER BY warehouse_id ASC`)
   - Simultaneous decrement of source and increment of destination
5. **Alert State Machine Transitions**:
   - Drop to &le; min threshold triggers `LOW_STOCK`
   - Drop to 0 transitions alert to `OUT_OF_STOCK` (zero duplicates)
   - Stock replenishment past minimum resolves the alert (`RESOLVED`)
6. **High-Contention Concurrency Test**:
   - 5 simultaneous Stock Out requests for 20 units against a stock of 50 units
   - Verified: Exactly 2 operations succeed, exactly 3 fail with insufficient stock
   - Final stock in DB is exactly 10 units (non-negative invariant preserved)
   - Exactly 2 movement records generated
7. **Stock Adjustment Safeguards**:
   - Manager adjustment with mandatory reason and recorded delta
   - Immutable audit movement created
8. **Admin Warehouse Assignment CRUD**:
   - Add warehouse assignment to user
   - Revoke warehouse assignment from user

---

## API Reference Overview

| Endpoint | Method | Role Allowed | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | POST | Public | User login with rate limiting |
| `/api/auth/me` | GET | Authenticated | Profile & assigned facilities |
| `/api/auth/logout` | POST | Authenticated | Session invalidation |
| `/api/auth/change-password` | PUT | Authenticated | Secure password update |
| `/api/users` | GET, POST | ADMIN | User management & creation |
| `/api/users/:id` | GET, PUT | ADMIN | User details & update |
| `/api/users/:id/warehouses` | POST, DELETE | ADMIN | Assign / Revoke warehouse permissions |
| `/api/warehouses` | GET, POST | Authenticated (Admin for write) | Warehouse listing & creation |
| `/api/warehouses/:id` | GET, PUT | Authenticated (Admin for write) | Facility details & update |
| `/api/categories` | GET, POST, PUT, DELETE | Authenticated (Admin for write) | Category management with safe delete |
| `/api/products` | GET, POST, PUT | Authenticated (Admin for write) | Product catalog management |
| `/api/products/:id` | GET | Authenticated | Product details & warehouse breakdown |
| `/api/inventory` | GET | Authenticated | Multi-warehouse inventory matrix |
| `/api/inventory/stock-in` | POST | ADMIN, MANAGER, STAFF | Execute Stock In with reference & reason |
| `/api/inventory/stock-out` | POST | ADMIN, MANAGER, STAFF | Execute Stock Out with stock check |
| `/api/inventory/transfer` | POST | ADMIN, MANAGER, STAFF | Atomic inter-warehouse transfer |
| `/api/inventory/adjustment` | POST | ADMIN, MANAGER | Physical stock discrepancy reconciliation |
| `/api/inventory/history` | GET | Authenticated | Filtered immutable audit trail |
| `/api/inventory/alerts` | GET | Authenticated | Low stock & out of stock alert center |
| `/api/dashboard/metrics` | GET | Authenticated | Scoped KPI counters & stock value |
| `/api/dashboard/stock-breakdown`| GET | Authenticated | Facility volume & category distribution |
| `/api/dashboard/recent-activity`| GET | Authenticated | Recent 8 movements & critical alerts |

---

## Security Architecture

- **SQL Injection Prevention**: 100% parameterized SQL prepared statements via `mysql2/promise`.
- **CORS**: Intentional origin whitelist, credentials support, and explicit HTTP methods.
- **Helmet**: Full HTTP security headers (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options).
- **Rate Limiting**: Dedicated auth limiter (15 req/15 min) to block brute-force attacks and global API limiter (500 req/15 min).
- **Safe Error Responses**: Centralized error middleware masks internal server paths, database internals, and stack traces from client responses.

---

## License

ISC License. Standalone Enterprise Software.
