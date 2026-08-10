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
    let mysqlSql = sql.replace(/\$\d+/g, '?');
    let mysqlParams = [...params];
    let isReturningInsert = false;
    let isReturningUpdate = false;
    
    // 1. Emulate RETURNING clause for INSERT/UPDATE
    if (sql.includes('RETURNING')) {
      if (sql.trim().toLowerCase().startsWith('insert')) {
        isReturningInsert = true;
      } else if (sql.trim().toLowerCase().startsWith('update')) {
        isReturningUpdate = true;
      }
      mysqlSql = mysqlSql.split('RETURNING')[0].trim();
    }
    
    // 2. Emulate ON CONFLICT clause
    if (sql.includes('ON CONFLICT')) {
      mysqlSql = mysqlSql.split('ON CONFLICT')[0].trim() + ' ON DUPLICATE KEY UPDATE data = ?, updated_at = CURRENT_TIMESTAMP';
      mysqlParams.push(params[1]); // Append the 'data' parameter again for the duplicate update statement
    }
    
    // Execute query
    const [result] = await mysqlPool.query(mysqlSql, mysqlParams);
    
    // Format return rows
    let rows = [];
    if (isReturningInsert) {
      rows = [{
        id: result.insertId,
        username: params[0],
        email: params[1]
      }];
    } else if (isReturningUpdate) {
      rows = [{
        id: params[3],
        username: params[0],
        email: params[1]
      }];
    } else if (Array.isArray(result)) {
      rows = result;
    }
    
    return {
      rows: rows
    };
  },
  
  connect: async () => {
    const connection = await mysqlPool.getConnection();
    return {
      query: async (sql, params = []) => {
        let mysqlSql = sql.replace(/\$\d+/g, '?');
        let mysqlParams = [...params];
        let isReturningInsert = false;
        let isReturningUpdate = false;
        
        if (sql.includes('RETURNING')) {
          if (sql.trim().toLowerCase().startsWith('insert')) {
            isReturningInsert = true;
          } else if (sql.trim().toLowerCase().startsWith('update')) {
            isReturningUpdate = true;
          }
          mysqlSql = mysqlSql.split('RETURNING')[0].trim();
        }
        
        if (sql.includes('ON CONFLICT')) {
          mysqlSql = mysqlSql.split('ON CONFLICT')[0].trim() + ' ON DUPLICATE KEY UPDATE data = ?, updated_at = CURRENT_TIMESTAMP';
          mysqlParams.push(params[1]);
        }
        
        const [result] = await connection.query(mysqlSql, mysqlParams);
        
        let rows = [];
        if (isReturningInsert) {
          rows = [{
            id: result.insertId,
            username: params[0],
            email: params[1]
          }];
        } else if (isReturningUpdate) {
          rows = [{
            id: params[3],
            username: params[0],
            email: params[1]
          }];
        } else if (Array.isArray(result)) {
          rows = result;
        }
        
        return { rows };
      },
      release: () => connection.release()
    };
  },
  
  on: (event, handler) => {
    // No-op to prevent crashes if pool.on is called
    console.log(`Registered MySQL pool listener on event: ${event}`);
  },
  
  end: () => mysqlPool.end()
};
