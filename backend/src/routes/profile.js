import express from 'express';
import { pool } from '../db/pool.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get profile config for the current authenticated user
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query('SELECT data FROM profiles WHERE user_id = $1', [userId]);
    
    if (result.rows.length === 0) {
      // Default to empty array if no profile is saved yet
      return res.json([]);
    }

    res.json(result.rows[0].data);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upsert profile config for the current authenticated user
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { data } = req.body;

  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: 'Invalid profile data. Must be a sections array.' });
  }

  try {
    await pool.query(
      `INSERT INTO profiles (user_id, data, updated_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP) 
       ON CONFLICT (user_id) 
       DO UPDATE SET data = $2, updated_at = CURRENT_TIMESTAMP`,
      [userId, JSON.stringify(data)]
    );

    res.json({ message: 'Profile saved successfully' });
  } catch (err) {
    console.error('Error saving profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
