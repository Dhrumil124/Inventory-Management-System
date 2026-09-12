const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
};

const DB_NAME = process.env.DB_NAME || 'inventory_db';

async function initDatabase() {
  console.log(`[DB-INIT] Connecting to MySQL server at ${config.host}:${config.port}...`);
  let connection;

  try {
    connection = await mysql.createConnection(config);
    console.log('[DB-INIT] Connected successfully to MySQL.');

    // 1. Create database if not exists
    console.log(`[DB-INIT] Ensuring database '${DB_NAME}' exists...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await connection.query(`USE \`${DB_NAME}\`;`);
    console.log(`[DB-INIT] Database '${DB_NAME}' is ready.`);

    // 2. Read and apply schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('[DB-INIT] Applying database schema tables and constraints...');
    await connection.query(schemaSql);
    console.log('[DB-INIT] Schema tables created successfully.');

    // 3. Read and apply seeds
    const seedPath = path.join(__dirname, 'seed.sql');
    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      console.log('[DB-INIT] Applying initial seed data...');
      await connection.query(seedSql);
      console.log('[DB-INIT] Seed data populated successfully.');
    }

    console.log('[DB-INIT] All database initialization steps completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[DB-INIT] Initialization failed:', error.message);
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        // ignore close error
      }
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
