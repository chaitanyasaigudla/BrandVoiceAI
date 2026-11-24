import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectDatabase, isDbConnected } from './lib/prisma';
import { logger } from './lib/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import brandRoutes from './routes/brand.routes';
import contentRoutes from './routes/content.routes';
import consistencyRoutes from './routes/consistency.routes';
import memoryRoutes from './routes/memory.routes';
import campaignRoutes from './routes/campaign.routes';
import analyticsRoutes from './routes/analytics.routes';

const app: Application = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use('/api', rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
}));

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    success:     true,
    message:     'BrandVoice AI API is running',
    version:     '1.0.0',
    timestamp:   new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database:    isDbConnected() ? 'connected' : 'unavailable',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.get('/api', (_req, res) => {
  res.json({
    success: true,
    message: 'BrandVoice AI REST API v1',
    docs:    'https://github.com/brandvoice-ai/api-docs',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/consistency', consistencyRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/analytics', analyticsRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

// ─── Server Startup ───────────────────────────────────────────────────────────

async function startServer(): Promise<void> {
  // Connect to DB (non-fatal if it fails)
  await connectDatabase();

  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 BrandVoice AI API listening on http://localhost:${PORT}`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔗 Health:      http://localhost:${PORT}/health`);
    logger.info(`🔗 API:         http://localhost:${PORT}/api`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => { logger.info('SIGTERM received'); process.exit(0); });
process.on('SIGINT',  () => { logger.info('SIGINT received');  process.exit(0); });

startServer().catch((err) => {
  logger.error('Fatal startup error', { error: err });
  process.exit(1);
});
