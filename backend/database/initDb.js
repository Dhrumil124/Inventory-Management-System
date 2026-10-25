const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'honorbee123'
};

const DB_NAME = process.env.DB_NAME || 'inventory_db';

async function initDatabase() {
  console.log(`[DB-INIT] Connecting to PostgreSQL server at ${config.host}:${config.port}...`);
  let rootClient;
  let dbClient;

  try {
    // 1. Connect to default 'postgres' database to check/create target database
    rootClient = new Client({ ...config, database: 'postgres' });
    await rootClient.connect();
    console.log('[DB-INIT] Connected successfully to PostgreSQL.');

    const checkRes = await rootClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME]);
    if (checkRes.rowCount === 0) {
      console.log(`[DB-INIT] Database '${DB_NAME}' does not exist. Creating...`);
      await rootClient.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`[DB-INIT] Database '${DB_NAME}' created successfully.`);
    } else {
      console.log(`[DB-INIT] Database '${DB_NAME}' already exists.`);
    }
    await rootClient.end();
    rootClient = null;

    // 2. Connect directly to target database
    console.log(`[DB-INIT] Connecting to database '${DB_NAME}'...`);
    dbClient = new Client({ ...config, database: DB_NAME });
    await dbClient.connect();

    // 3. Apply schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('[DB-INIT] Applying database schema tables and constraints...');
    await dbClient.query(schemaSql);
    console.log('[DB-INIT] Schema tables created successfully.');

    // 4. Apply seeds
    const seedPath = path.join(__dirname, 'seed.sql');
    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      console.log('[DB-INIT] Applying initial seed data...');
      await dbClient.query(seedSql);
      console.log('[DB-INIT] Seed data populated successfully.');
    }

    console.log('[DB-INIT] All database initialization steps completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[DB-INIT] Initialization failed:', error.message);
    process.exit(1);
  } finally {
    if (rootClient) {
      try { await rootClient.end(); } catch (e) {}
    }
    if (dbClient) {
      try { await dbClient.end(); } catch (e) {}
    }
  }
}

initDatabase();
