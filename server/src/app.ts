/**
 * Express Application Factory
 *
 * Creates and configures the Express app with all routes.
 * Separated from server.ts so the same app can be used by:
 *   1. Local dev server (server.ts → app.listen())
 *   2. Vercel serverless (api/index.ts → export default app)
 */
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import socialAuthRoutes from './routes/socialAuthRoutes.js';
import inviteRoutes from './routes/inviteRoutes.js';
import proposalRoutes from './routes/proposalRoutes.js';
import telemetryRoutes from './routes/telemetryRoutes.js';
import importRoutes from './routes/importRoutes.js';
import balancingRoutes from './routes/balancingRoutes.js';
import mcpRoutes from './routes/mcpRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import bodyParser from 'body-parser';

export function createApp(): express.Express {
  const app = express();

  // CORS — allow Vercel frontend domain + localhost
  const allowedOrigins = [
    config.cors.origin,
    'http://localhost:8443',
    'http://localhost:3000',
  ].filter(Boolean);

  app.use(cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (Vercel serverless same-origin, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.some(o => origin.startsWith(o))) return callback(null, true);
      // In production, also allow the Vercel deployment URL pattern
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
  }));

  // ── CRITICAL: Raw body parser for Stripe webhook MUST come before bodyParser.json() ──
  app.use(
    '/api/billing/webhook',
    bodyParser.raw({ type: 'application/json' }),
    (req: any, _res: express.Response, next: express.NextFunction) => {
      req.rawBody = req.body;
      next();
    }
  );

  // Standard JSON body parser for all other routes
  app.use(bodyParser.json({ limit: '10mb' }));

  // ── Routes ─────────────────────────────────────────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/auth/social', socialAuthRoutes);
  app.use('/api/invite', inviteRoutes);
  app.use('/api/projects', proposalRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/billing', webhookRoutes);
  app.use('/api/billing', billingRoutes);
  app.use('/api/exports', exportRoutes);
  app.use('/api/telemetry', telemetryRoutes);
  app.use('/api/import', importRoutes);
  app.use('/api/balancing', balancingRoutes);
  app.use('/api/mcp', mcpRoutes);

  // ── Enhanced health endpoint ───────────────────────────────────────────────
  app.get('/api/health', async (_req, res) => {
    const checks: Record<string, string> = {
      server: 'ok',
      timestamp: new Date().toISOString(),
      env: config.env,
      runtime: process.env.VERCEL ? 'vercel-serverless' : 'standalone',
    };

    try {
      const { getDatabase } = await import('./models/schema.js');
      const db = getDatabase();
      await db.get('SELECT 1');
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    checks.openai = config.openai.apiKey ? 'configured' : 'demo_mode';
    checks.stripe = config.stripe.secretKey ? 'configured' : 'not_configured';
    checks.stripeWebhook = config.stripe.webhookSecret ? 'configured' : 'not_configured';

    const hasError = Object.values(checks).includes('error');
    res.status(hasError ? 503 : 200).json({
      status: hasError ? 'degraded' : 'ok',
      version: '2.0.0',
      checks,
    });
  });

  // ── Global error handler ───────────────────────────────────────────────────
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Server Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}
