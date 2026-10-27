import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// Middlewares
import { requestIdMiddleware } from './src/middleware/requestId.ts';
import { getDbStatus } from './src/config/db.ts';

// Routes
import { authRoutes } from './src/routes/authRoutes.ts';
import { linksRoutes } from './src/routes/linksRoutes.ts';
import { redirectRoutes } from './src/routes/redirectRoutes.ts';
import { analyticsRoutes } from './src/routes/analyticsRoutes.ts';
import { campaignsRoutes } from './src/routes/campaignsRoutes.ts';
import { foldersTagsRoutes } from './src/routes/foldersTagsRoutes.ts';
import { adminRoutes } from './src/routes/adminRoutes.ts';
import { importsRoutes } from './src/routes/importsRoutes.ts';
import { bioRoutes } from './src/routes/bioRoutes.ts';
import { policyLabRoutes } from './src/routes/policyLabRoutes.ts';
import { trustCenterRoutes } from './src/routes/trustCenterRoutes.ts';
import { lifecycleRoutes } from './src/routes/lifecycleRoutes.ts';
import { experimentsRoutes } from './src/routes/experimentsRoutes.ts';

const app = express();

// Base middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestIdMiddleware);

// Operational Reliability & Health Endpoints
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'LinkPulse Core Platform',
    stack: 'Node.js + Express + React + Mongoose (MongoDB)',
    database: getDbStatus(),
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/ready', (_req: Request, res: Response) => {
  const dbStatus = getDbStatus();
  if (dbStatus.status === 'healthy') {
    return res.json({ ready: true, database: dbStatus });
  }
  return res.status(503).json({ ready: false, database: dbStatus });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/links', linksRoutes);
app.use('/api/v1/campaigns', campaignsRoutes);
app.use('/api/v1', foldersTagsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/imports', importsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/bio', bioRoutes);

// Differentiator / Signature Feature Endpoints
app.use('/api/v1/policy-lab', policyLabRoutes);
app.use('/api/v1/trust-center', trustCenterRoutes);
app.use('/api/v1/lifecycle', lifecycleRoutes);
app.use('/api/v1/experiments', experimentsRoutes);

// Public Redirect Engine (/r/:code & verify-password & metadata)
app.use(redirectRoutes);

// Database Offline Fallback Middleware (Graceful Degraded Mode)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (
    err.name === 'MongooseError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoServerSelectionError' ||
    (typeof err.message === 'string' && err.message.includes('buffering timed out'))
  ) {
    console.warn('[AI Studio] Database offline — returning mock/safe response');
    if (req.method === 'GET') {
      return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
    }
    return res.status(503).json({ error: 'Service temporarily unavailable (database offline)' });
  }
  next(err);
});

// Centralized Error Handler
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error(`[Unhandled Error] [${(req as any).requestId || 'no-id'}]`, err);
  return res.status(err.status || 500).json({
    error: err.message || 'An unexpected internal error occurred.',
    requestId: (req as any).requestId,
  });
});

export default app;
