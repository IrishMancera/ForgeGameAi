/**
 * Vercel Serverless Function — API Entry Point
 *
 * This file is the single serverless function that handles ALL /api/* requests.
 * Vercel routes requests here via the rewrites in vercel.json.
 *
 * Cold start: initializes database + creates Express app (once per instance).
 * Warm requests: reuses the existing app and DB connection.
 *
 * Requirements:
 *   - DATABASE_URL must be a Postgres connection string (set in Vercel env vars)
 *   - sqlite3 is NOT available in Vercel — only Postgres is supported in production
 *   - The server must be compiled first: npm --prefix server run build
 */

let app;
let initialized = false;

export default async function handler(req, res) {
  if (!initialized) {
    try {
      // Import compiled server modules from server/dist/
      const { initializeDatabase } = await import('../server/dist/models/schema.js');
      const { config } = await import('../server/dist/config.js');
      const { createApp } = await import('../server/dist/app.js');

      // Validate DATABASE_URL is Postgres (sqlite3 cannot run in Vercel)
      if (!config.databaseUrl.startsWith('postgres')) {
        console.error('[Vercel] DATABASE_URL must be a Postgres connection string. Set it in Vercel project settings.');
        return res.status(503).json({
          error: 'Database not configured',
          detail: 'Set DATABASE_URL to a Postgres connection string in Vercel project settings.',
        });
      }

      // Initialize database (Postgres connection pool)
      await initializeDatabase(config.databaseUrl);

      // Seed initial data (safe to call multiple times — idempotent)
      try {
        const { seedInitialData } = await import('../server/dist/services/seedService.js');
        await seedInitialData();
      } catch (seedErr) {
        console.warn('[Vercel] Seed skipped:', seedErr.message);
      }

      // Create the Express app with all routes
      app = createApp();
      initialized = true;

      console.log('[Vercel] GameForge AI serverless function initialized successfully.');
    } catch (initErr) {
      console.error('[Vercel] Initialization failed:', initErr);
      return res.status(503).json({
        error: 'Server initialization failed',
        detail: initErr.message,
      });
    }
  }

  // Delegate to Express
  return app(req, res);
}
