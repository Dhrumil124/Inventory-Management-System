const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

module.exports = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'inventory_db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  },
  JWT: {
    secret: process.env.JWT_SECRET || 'fallback_secret_key_change_in_production_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  CORS: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  },
  RATE_LIMIT: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '500', 10),
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '15', 10)
  }
};
