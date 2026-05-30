import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import dotenv from 'dotenv';
import { authenticateToken } from '../middleware/auth.js';

dotenv.config({ override: true });

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'applybuddy_secret_key';

const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

// Register User
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  try {
    // Check if user already exists
    const userCheck = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password with 12 salt rounds
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user and fetch returned id and username
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );

    const user = newUser.rows[0];

    // Generate JWT token valid for 7 days
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    setTokenCookie(res, token);

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Check for user credentials by email
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token valid for 7 days
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    setTokenCookie(res, token);

    res.json({
      message: 'Logged in successfully',
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout User
router.post('/logout', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });
  res.json({ message: 'Logged out successfully' });
});

// Get Current User (Me)
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Update User Profile (Username, Email, Password)
router.put('/profile', authenticateToken, async (req, res) => {
  const { username, email, currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword) {
    return res.status(400).json({ error: 'Current password is required to verify changes' });
  }

  try {
    // 1. Fetch user from database
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userResult.rows[0];

    // 2. Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    // 3. Prepare updates
    let updatedUsername = user.username;
    let updatedEmail = user.email;
    let updatedPasswordHash = user.password;

    // Check if username already taken if changing
    if (username && username !== user.username) {
      const usernameCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      if (usernameCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      updatedUsername = username;
    }

    // Check if email already taken if changing
    if (email && email !== user.email) {
      const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      updatedEmail = email;
    }

    // Hash new password if provided
    if (newPassword && newPassword.trim() !== '') {
      updatedPasswordHash = await bcrypt.hash(newPassword, 12);
    }

    // 4. Perform update query
    const updateResult = await pool.query(
      'UPDATE users SET username = $1, email = $2, password = $3 WHERE id = $4 RETURNING id, username, email',
      [updatedUsername, updatedEmail, updatedPasswordHash, userId]
    );

    const updatedUser = updateResult.rows[0];

    // 5. Generate a new JWT token since credentials changed
    const token = jwt.sign(
      { id: updatedUser.id, username: updatedUser.username, email: updatedUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    setTokenCookie(res, token);

    res.json({
      message: 'Profile updated successfully',
      user: { id: updatedUser.id, username: updatedUser.username, email: updatedUser.email }
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
