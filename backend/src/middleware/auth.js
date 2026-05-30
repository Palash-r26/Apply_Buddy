import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'applybuddy_secret_key';

export function authenticateToken(req, res, next) {
  // Read token from cookies
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    // Attach user profile information (id, username) to request object
    req.user = decoded;
    next();
  });
}
