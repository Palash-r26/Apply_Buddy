import { pool } from './pool.js';

export async function initDb() {
  const client = await pool.connect();
  try {
    // Create users table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create profiles table if not exists, containing dynamic JSONB array data
    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        data JSONB NOT NULL DEFAULT '[]'::jsonb,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('PostgreSQL Database tables initialized successfully.');
  } catch (err) {
    console.error('Error initializing PostgreSQL tables:', err);
    throw err;
  } finally {
    client.release();
  }
}
