import dotenv from 'dotenv';

// dotenv.config() looks for .env relative to process.cwd()
// When started via `npm --prefix server run dev` or `npm run dev:all`,
// process.cwd() is always "server/" — so server/.env is found automatically.
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001'),
  databaseUrl: process.env.DATABASE_URL || './gameforge.db',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8443',
  },
  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@forgegame.ai',
  },
};

// Warn on startup if using unsafe defaults
if (config.jwtSecret === 'dev-secret-key') {
  console.warn('[CONFIG] ⚠️  JWT_SECRET is using the default dev value. Set a real secret in server/.env before production.');
}
