import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'applybuddy_secret_key';

// Register User
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Check if user already exists
    const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password with salt rounds
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user and fetch returned id and username
    const newUser = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );

    const user = newUser.rows[0];

    // Generate JWT token valid for 7 days
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, username: user.username },
      token
    });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Check for user credentials
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const user = userResult.rows[0];

    // Compare bcrypt passwords
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    // Generate JWT token valid for 7 days
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Logged in successfully',
      user: { id: user.id, username: user.username },
      token
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
