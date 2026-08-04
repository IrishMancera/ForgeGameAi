/**
 * Local Development Server
 *
 * Initializes the database, seeds data, and starts Express on localhost.
 * For Vercel serverless deployment, see api/index.mjs instead.
 */
import { config } from './config.js';
import { initializeDatabase } from './models/schema.js';
import { createApp } from './app.js';
import { runStartupChecks } from './utils/startupChecks.js';
import { seedInitialData } from './services/seedService.js';

// Validate environment
runStartupChecks();

// Initialize database, then start server
initializeDatabase(config.databaseUrl)
  .then(async () => {
    await seedInitialData();
    const app = createApp();
    app.listen(config.port, '0.0.0.0', () => {
      console.log(`[Server] GameForge AI v2.0 running on http://localhost:${config.port}`);
      console.log(`[Server] Environment: ${config.env}`);
      console.log(`[Server] Database: ${config.databaseUrl.startsWith('postgres') ? 'Postgres' : 'SQLite'}`);
      console.log(`[Server] AI mode: ${config.openai.apiKey ? 'Live (gpt-4o-mini)' : 'Demo'}`);
    });
  })
  .catch((error) => {
    console.error('[Server] Database initialization failed:', error);
    process.exit(1);
  });
