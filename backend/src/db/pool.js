import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/applybuddy';

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});
