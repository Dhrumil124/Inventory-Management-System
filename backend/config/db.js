const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'inventory_db',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  timezone: '+00:00'
});

// Test connection on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('[DB-POOL] MySQL connection pool established successfully.');
    connection.release();
  } catch (err) {
    console.error('[DB-POOL] Failed to connect to MySQL database:', err.message);
  }
})();

module.exports = pool;
