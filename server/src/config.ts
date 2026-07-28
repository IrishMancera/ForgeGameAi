import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001'),
  databaseUrl: process.env.DATABASE_URL || './gameforge.db',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8443',
  },
};
