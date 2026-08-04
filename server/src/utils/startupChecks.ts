/**
 * Startup Validation
 *
 * Validates required environment variables before the server starts.
 * In production/staging: logs errors and optionally blocks startup.
 * In Vercel serverless: logs errors but NEVER calls process.exit()
 *   (serverless functions must return a response, not crash).
 * In local development: warns but allows startup.
 */

interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

const REQUIRED_IN_PRODUCTION = [
  { key: 'JWT_SECRET', forbidden: ['dev-secret-key', ''], reason: 'JWT secret must be a secure random value in production' },
  { key: 'DATABASE_URL', forbidden: ['', './gameforge.db'], reason: 'DATABASE_URL must be a Postgres connection string in production' },
];

const REQUIRED_FOR_FEATURES = [
  { key: 'OPENAI_API_KEY', feature: 'AI analysis', critical: false },
  { key: 'STRIPE_SECRET_KEY', feature: 'billing', critical: false },
  { key: 'STRIPE_WEBHOOK_SECRET', feature: 'Stripe webhook signature verification', critical: false },
  { key: 'STRIPE_PRICE_SOLO', feature: 'Solo plan checkout', critical: false },
  { key: 'STRIPE_PRICE_STUDIO', feature: 'Studio plan checkout', critical: false },
  { key: 'STRIPE_PRICE_ENTERPRISE', feature: 'Enterprise plan checkout', critical: false },
];

export function validateStartup(): ValidationResult {
  const env = process.env.NODE_ENV || 'development';
  const isProduction = env === 'production' || env === 'staging';
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isProduction) {
    for (const req of REQUIRED_IN_PRODUCTION) {
      const value = process.env[req.key] || '';
      if (req.forbidden.includes(value)) {
        errors.push(`[STARTUP] ❌ ${req.key}: ${req.reason}`);
      }
    }
  }

  for (const feature of REQUIRED_FOR_FEATURES) {
    if (!process.env[feature.key]) {
      warnings.push(`[STARTUP] ⚠️  ${feature.key} not set — ${feature.feature} will use demo/fallback mode`);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function runStartupChecks(): void {
  const result = validateStartup();
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

  for (const warning of result.warnings) {
    console.warn(warning);
  }

  for (const error of result.errors) {
    console.error(error);
  }

  if (!result.ok) {
    if (isServerless) {
      // In serverless: log errors but do NOT exit — the function must return a response
      console.error('[STARTUP] ❌ Missing production secrets detected in serverless environment.');
    } else if (process.env.NODE_ENV === 'production') {
      console.error('[STARTUP] ❌ Server startup blocked. Exiting.');
      process.exit(1);
    }
  }

  if (result.ok) {
    console.log(`[STARTUP] ✅ Environment validated for ${process.env.NODE_ENV || 'development'}.`);
  }
}
