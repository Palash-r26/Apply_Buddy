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

  // Set of dummy/mock values to clean/never save for any user
  const MOCK_VALUES_TO_BAN = new Set([
    'Alex Developer',
    'alex@example.com',
    '+1 234 567 8900',
    'San Francisco, CA',
    '94105',
    'https://alexdev.me/',
    'https://linkedin.com/in/alex-developer',
    'https://github.com/alex-dev',
    'University of Technology',
    'Computer Science',
    '3.8',
    '2020 - 2024',
    'Software Engineer',
    'Full Stack Development',
    'JavaScript, TypeScript, Python',
    'React.js, Node.js, HTML5, CSS3',
    'Node.js, Express.js, PostgreSQL',
    'MongoDB, PostgreSQL',
    'Chrome Extension Vault',
    'Assessment Engine'
  ]);

  // Sanitize data recursively/iteratively before saving
  const sanitizedData = data.map(section => {
    if (!section || typeof section !== 'object') return section;
    const fields = Array.isArray(section.fields) 
      ? section.fields.map(field => {
          if (!field || typeof field !== 'object') return field;
          
          let val = field.value;
          // If the field value is a banned mock value, replace with empty string
          if (typeof val === 'string' && MOCK_VALUES_TO_BAN.has(val.trim())) {
            val = '';
          } else if (typeof val === 'number' && MOCK_VALUES_TO_BAN.has(val.toString().trim())) {
            val = '';
          }
          
          return { ...field, value: val };
        })
      : [];
    return { ...section, fields };
  });

  try {
    await pool.query(
      `INSERT INTO profiles (user_id, data, updated_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP) 
       ON CONFLICT (user_id) 
       DO UPDATE SET data = $2, updated_at = CURRENT_TIMESTAMP`,
      [userId, JSON.stringify(sanitizedData)]
    );

    res.json({ message: 'Profile saved successfully' });
  } catch (err) {
    console.error('Error saving profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
