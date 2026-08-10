import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const dbUrl = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/applybuddy';

let poolConfig = {};

try {
  const parsedUrl = new URL(dbUrl);
  const [username, password] = parsedUrl.username ? [parsedUrl.username, parsedUrl.password] : [null, null];
  
  poolConfig = {
    host: parsedUrl.hostname,
    port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 3306,
    user: username ? decodeURIComponent(username) : undefined,
    password: password ? decodeURIComponent(password) : undefined,
    database: parsedUrl.pathname ? parsedUrl.pathname.substring(1) : undefined,
    ssl: dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1') ? undefined : { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
} catch (e) {
  console.error('Error parsing DATABASE_URL, falling back to empty config:', e);
}

const mysqlPool = mysql.createPool(poolConfig);

// Helper wrapper to make mysql2 behave like pg (PostgreSQL)
export const pool = {
  query: async (sql, params = []) => {
    // Convert postgres-style $1, $2 placeholders to mysql ?
    const mysqlSql = sql.replace(/\$\d+/g, '?');
    
    // Execute query
    const [rows] = await mysqlPool.query(mysqlSql, params);
    
    // Return PG-compatible wrapper
    return {
      rows: rows
    };
  },
  
  connect: async () => {
    const connection = await mysqlPool.getConnection();
    return {
      query: async (sql, params = []) => {
        const mysqlSql = sql.replace(/\$\d+/g, '?');
        const [rows] = await connection.query(mysqlSql, params);
        return { rows };
      },
      release: () => connection.release()
    };
  },
  
  on: (event, handler) => {
    // No-op to prevent crashes if pool.on is called (e.g. pg pool error event listener)
    console.log(`Registered MySQL pool listener on event: ${event}`);
  },
  
  end: () => mysqlPool.end()
};
