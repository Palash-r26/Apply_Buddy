import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../db/pool.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth.js';

dotenv.config({ override: true });

const router = express.Router();

const isProduction = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (isProduction) {
    throw new Error('FATAL: JWT_SECRET environment variable is not defined in production!');
  }
  console.warn('WARNING: JWT_SECRET environment variable is not defined. Using weak fallback secret for local development.');
}

const finalSecret = JWT_SECRET || 'applybuddy_secret_key';

// Strictly limit authentications (registration/login) to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Max 15 attempts per IP per 15 minutes
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

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
router.post('/register', authLimiter, async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  try {
    // Check if user already exists
    const userCheck = await pool.query('SELECT * FROM users WHERE name = $1 OR email = $2', [username, email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password with 12 salt rounds
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user and fetch returned id and username
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name as username, email',
      [username, email, hashedPassword]
    );

    const user = newUser.rows[0];

    // Generate JWT token valid for 7 days
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, finalSecret, { expiresIn: '7d' });

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
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Check for user credentials by email
    const userResult = await pool.query('SELECT id, name as username, email, password_hash as password FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token valid for 7 days
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, finalSecret, { expiresIn: '7d' });

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
    const userResult = await pool.query('SELECT id, name as username, email, password_hash as password FROM users WHERE id = $1', [userId]);
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
      const usernameCheck = await pool.query('SELECT * FROM users WHERE name = $1', [username]);
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
      'UPDATE users SET name = $1, email = $2, password_hash = $3 WHERE id = $4 RETURNING id, name as username, email',
      [updatedUsername, updatedEmail, updatedPasswordHash, userId]
    );

    const updatedUser = updateResult.rows[0];

    // 5. Generate a new JWT token since credentials changed
    const token = jwt.sign(
      { id: updatedUser.id, username: updatedUser.username, email: updatedUser.email },
      finalSecret,
      { expiresIn: '7d' }
    );
    setTokenCookie(res, token);

    res.json({
      message: 'Profile updated successfully',
      user: { id: updatedUser.id, username: updatedUser.username, email: updatedUser.email }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Forgot Password Request
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    // Even if user doesn't exist, we send a success response to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to DB
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
      [resetToken, tokenExpiry, user.id]
    );

    // Send email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    const emailSent = await sendPasswordResetEmail(user.email, resetUrl);
    
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send reset email. Please try again later.' });
    }

    res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Find user by token and ensure token is not expired
    const userResult = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > CURRENT_TIMESTAMP',
      [token]
    );
    
    const user = userResult.rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json({ message: 'Password has been successfully reset. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
