import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

import { env } from './config/env.js';
import { globalErrorHandler } from './middleware/errorHandler.js';

// Route modules
import authRoutes from './modules/auth/routes.js';
import userRoutes from './modules/users/routes.js';
import exerciseRoutes from './modules/exercises/routes.js';
import trainingRoutes from './modules/training/routes.js';
import leaderboardRoutes from './modules/leaderboard/routes.js';
import profileRoutes from './modules/profile/routes.js';
import achievementRoutes from './modules/achievements/routes.js';
import battleRoutes from './modules/battles/routes.js';
import clanRoutes from './modules/clans/routes.js';
import dailyRoutes from './modules/daily/routes.js';
import waitlistRoutes from './modules/waitlist/routes.js';

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────

app.use(helmet());
app.use(cors({
  origin: [env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json());

// ─── Health Check ────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ─────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/clans', clanRoutes);
app.use('/api/daily', dailyRoutes);
app.use('/api/waitlist', waitlistRoutes);

// ─── Error Handler ───────────────────────────────────────────────────

app.use(globalErrorHandler);

// ─── Start Server ────────────────────────────────────────────────────

app.listen(env.PORT, () => {
  console.log(`\n🚀 NeuralRush backend running on http://localhost:${env.PORT}`);
  console.log(`📦 Database: SQLite (file:./dev.db)`);
  console.log(`🌍 Accepting requests from: ${env.FRONTEND_URL}`);
});
