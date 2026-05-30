import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import { initDb } from './db/init.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware configuration
app.use(cors({
  origin: true,
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
