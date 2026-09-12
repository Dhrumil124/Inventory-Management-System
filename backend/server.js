const app = require('./app');
const { PORT } = require('./config/env');
const pool = require('./config/db');

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Inventory Management System API Server`);
  console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Listening on: http://localhost:${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});

// Graceful Shutdown
function handleShutdown(signal) {
  console.log(`\n[SERVER] Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('[SERVER] HTTP server closed.');
    try {
      await pool.end();
      console.log('[SERVER] MySQL connection pool drained.');
      process.exit(0);
    } catch (err) {
      console.error('[SERVER] Error closing MySQL pool:', err);
      process.exit(1);
    }
  });

  // Force close if graceful shutdown stalls
  setTimeout(() => {
    console.error('[SERVER] Forcefully terminating process.');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
