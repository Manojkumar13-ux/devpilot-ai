import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { validateEnv } from './lib/env.js';
import authRoutes from './routes/auth.js';
import problemRoutes from './routes/problem.routes.js';
import submissionRoutes from './routes/submission.routes.js';
import profileRoutes from './routes/profile.js';
import leaderboardRoutes from './routes/leaderboard.js';
import analyticsRoutes from './routes/analytics.js';
import settingsRoutes from './routes/settings.js';
import adminRoutes from './routes/admin.js';
import healthRoutes from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { createWorker } from './queue/worker.js';
import { SandboxService } from './services/sandbox.service.js';
import { logger } from './lib/logger.js';

validateEnv();

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Security headers ─────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173'].filter(Boolean),
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  originAgentCluster: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// ─── CORS ─────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// ─── Body parsing with size limits ────────────────────────────────
app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ extended: true, limit: '128kb' }));

// ─── Request logging ──────────────────────────────────────────────
app.use(requestLogger);

// ─── Granular rate limiters ───────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again later' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const submissionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions, please slow down' },
});

const aiReviewLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests, please wait' },
});

// ─── Routes ───────────────────────────────────────────────────────
// Health (no auth, no rate limit)
app.use('/', healthRoutes);

// Auth (strict rate limit)
app.use('/api/auth', authLimiter, authRoutes);

// General API
app.use('/api', apiLimiter);
app.use('/api/problems', problemRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);

// Submissions (stricter limit — covers both code exec and AI review)
app.use('/api/submissions', submissionLimiter, submissionRoutes);

// ─── Error handler ────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info({ port: PORT }, `Backend running on http://localhost:${PORT}`);

  createWorker().then(worker => {
    if (worker) logger.info('BullMQ worker started');
  });

  const sandbox = new SandboxService();
  sandbox.ensureSandboxImage().catch((err: Error) => {
    logger.warn({ err: err.message }, 'Sandbox image not available — first submission will trigger a build');
  });
});
