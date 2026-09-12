const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { CORS } = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const { errorResponse, successResponse } = require('./utils/responseFormatter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// 1. Security Headers via Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// 2. Controlled CORS Configuration
const configuredOrigins = (CORS.origin || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const allowedOrigins = [...new Set([...configuredOrigins, ...defaultOrigins])];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, server-to-server, tests) or wildcard configuration
    if (!origin || CORS.origin === '*' || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: Origin '${origin}' not permitted.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Body parsers with payload size limits to mitigate DoS
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// 4. Request Logging in development
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 5. Global API Rate Limiter
app.use('/api', apiLimiter);

// 6. Production Health Check Endpoint (verifies DB connection)
app.get('/api/health', async (req, res) => {
  try {
    const pool = require('./config/db');
    const [result] = await pool.execute('SELECT 1 AS alive');
    return successResponse(res, {
      status: 'HEALTHY',
      database: result && result[0]?.alive === 1 ? 'CONNECTED' : 'UNKNOWN',
      service: 'Inventory Management System API',
      timestamp: new Date().toISOString()
    }, 'Service is operational.');
  } catch (err) {
    return errorResponse(res, `Database unhealthy: ${err.message}`, 503);
  }
});

// 7. Mount Application Routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 8. Optional: Serve Built Frontend in Production (Single-Server Deployment)
const fs = require('fs');
const path = require('path');
const distPath = path.join(__dirname, '../frontend/dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 9. 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  return errorResponse(res, `API route not found: ${req.method} ${req.originalUrl}`, 404);
});

// 10. Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
