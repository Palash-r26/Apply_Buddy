import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const isProduction = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (isProduction) {
    throw new Error('FATAL: JWT_SECRET environment variable is not defined in production!');
  }
  console.warn('WARNING: JWT_SECRET environment variable is not defined. Using weak fallback secret for local development.');
}

const finalSecret = JWT_SECRET || 'applybuddy_secret_key';

export function authenticateToken(req, res, next) {
  // Read token from cookies
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  jwt.verify(token, finalSecret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    // Attach user profile information (id, username) to request object
    req.user = decoded;
    next();
  });
}
