import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import { initDb } from './db/init.js';

dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// HTTP Request Logging
if (isProduction) {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Hardened CORS configuration
const allowedOrigins = [
  'https://applybuddy.palashrai.me',
  'https://applybuddy-palash.vercel.app',

];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like server-to-server, postman/curl, or browser extensions in some scenarios)
    if (!origin) return callback(null, true);

    // Check if it is local development or chrome extension
    const isLocalOrExtension =
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.startsWith('chrome-extension://');

    if (!isProduction || isLocalOrExtension || allowedOrigins.includes(origin) || origin.endsWith('.palashrai.me')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Route mappings
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Server health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);

  const status = err.status || 500;
  const message = (isProduction && status === 500)
    ? 'Internal server error'
    : err.message;

  res.status(status).json({ error: message });
});

// Perform database migrations and lift Express listener
async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`ApplyBuddy API server successfully listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize database tables or start API listener:', err);
    process.exit(1);
  }
}

startServer();
