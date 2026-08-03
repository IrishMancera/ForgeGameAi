import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { initializeDatabase } from './models/schema.js';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import { seedInitialData } from './services/seedService.js';
import bodyParser from 'body-parser';

import proposalRoutes from './routes/proposalRoutes.js';

const app = express();

app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', proposalRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/exports', exportRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

initializeDatabase(config.databaseUrl)
  .then(async () => {
    await seedInitialData();
    app.listen(config.port, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${config.port}`);
    });
  })
  .catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });
