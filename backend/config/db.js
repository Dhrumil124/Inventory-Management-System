const { Pool, types } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Automatically parse PostgreSQL int8 (bigint/count) and numeric as standard numbers (like mysql2)
types.setTypeParser(20, (val) => (val === null ? null : parseInt(val, 10)));
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      max: parseInt(process.env.DB_CONNECTION_LIMIT || '15', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'honorbee123',
      database: process.env.DB_NAME || 'inventory_db',
      max: parseInt(process.env.DB_CONNECTION_LIMIT || '15', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    };

const pgPool = new Pool(poolConfig);

// Helper to convert '?' placeholders to '$1, $2...' and automatically append RETURNING id on INSERT
function prepareQuery(sql) {
  // Convert MySQL-style double-quoted string literals to PostgreSQL single-quoted string literals
  sql = sql.replace(/"([^"]+)"/g, "'$1'");

  let paramIndex = 1;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let converted = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      converted += char;
    } else if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      converted += char;
    } else if (char === '?' && !inSingleQuote && !inDoubleQuote) {
      converted += `$${paramIndex++}`;
    } else {
      converted += char;
    }
  }

  const trimmed = converted.trim().replace(/;$/, '');
  if (/^INSERT\s+INTO/i.test(trimmed) && !/\bRETURNING\b/i.test(trimmed)) {
    converted = `${trimmed} RETURNING id`;
  }

  return converted;
}

// Format result so it's drop-in compatible with mysql2 [rows, fields]
function formatResult(res) {
  const rows = res.rows || [];
  rows.insertId = rows[0]?.id || 0;
  rows.affectedRows = res.rowCount || 0;
  return [rows, res.fields];
}

async function executeQuery(clientOrPool, sql, params = []) {
  const pgSql = prepareQuery(sql);
  const res = await clientOrPool.query(pgSql, params);
  return formatResult(res);
}

// Wrap a client returned by pool.connect() / pool.getConnection()
function wrapClient(client) {
  return {
    rawClient: client,
    query: (sql, params) => executeQuery(client, sql, params),
    execute: (sql, params) => executeQuery(client, sql, params),
    beginTransaction: async () => {
      await client.query('BEGIN');
    },
    commit: async () => {
      await client.query('COMMIT');
    },
    rollback: async () => {
      await client.query('ROLLBACK');
    },
    release: () => {
      client.release();
    }
  };
}

const pool = {
  rawPool: pgPool,
  query: (sql, params) => executeQuery(pgPool, sql, params),
  execute: (sql, params) => executeQuery(pgPool, sql, params),
  getConnection: async () => {
    const client = await pgPool.connect();
    return wrapClient(client);
  },
  end: () => pgPool.end()
};

// Test connection on startup
(async () => {
  try {
    const client = await pgPool.connect();
    console.log('[DB-POOL] PostgreSQL connection pool established successfully.');
    client.release();
  } catch (err) {
    console.error('[DB-POOL] Failed to connect to PostgreSQL database:', err.message);
  }
})();

module.exports = pool;
