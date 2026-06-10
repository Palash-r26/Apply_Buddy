import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/applybuddy';

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Global error handling for the pool
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle DB client', err);
  // process.exit(-1); // optional: exit process if needed
});
