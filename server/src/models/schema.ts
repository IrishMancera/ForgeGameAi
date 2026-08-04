// Type-only import — erased at compile time, no runtime dep on sqlite
import type { Database } from 'sqlite';
import pg from 'pg';

const { Pool } = pg;

export interface DatabaseInterface {
  get<T = any>(sql: string, params?: any[]): Promise<T | null>;
  all<T = any>(sql: string, params?: any[]): Promise<T[]>;
  run(sql: string, params?: any[]): Promise<any>;
  exec(sql: string): Promise<void>;
}

class SqliteAdapter implements DatabaseInterface {
  constructor(private db: Database) {}

  async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const res = await this.db.get<T>(sql, params);
    return res !== undefined ? res : null;
  }

  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const res = await this.db.all<any>(sql, params);
    return res as T[];
  }

  async run(sql: string, params: any[] = []): Promise<any> {
    return this.db.run(sql, params);
  }

  async exec(sql: string): Promise<void> {
    await this.db.exec(sql);
  }
}

class PostgresAdapter implements DatabaseInterface {
  constructor(private pool: pg.Pool) {}

  private translate(sql: string): string {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const translated = this.translate(sql);
    const result = await this.pool.query(translated, params);
    return (result.rows[0] as T) || null;
  }

  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const translated = this.translate(sql);
    const result = await this.pool.query(translated, params);
    return result.rows as T[];
  }

  async run(sql: string, params: any[] = []): Promise<any> {
    const translated = this.translate(sql);
    const result = await this.pool.query(translated, params);
    return {
      changes: result.rowCount,
      lastID: null,
    };
  }

  async exec(sql: string): Promise<void> {
    await this.pool.query(sql);
  }
}

let db: DatabaseInterface | null = null;

export async function initializeDatabase(dbPath: string): Promise<DatabaseInterface> {
  if (db) return db;

  const isPostgres = dbPath.startsWith('postgres://') || dbPath.startsWith('postgresql://');

  if (isPostgres) {
    console.log('[Database] Connecting to hosted Postgres database...');
    const pool = new Pool({
      connectionString: dbPath,
      ssl: dbPath.includes('localhost') || dbPath.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
    });

    // Test connection
    await pool.query('SELECT NOW()');

    db = new PostgresAdapter(pool);
  } else {
    // Dynamic import — sqlite3 native module is only loaded for local dev.
    // In Vercel serverless, DATABASE_URL is always Postgres, so this branch
    // is never reached and the native binary is never bundled.
    console.log('[Database] Connecting to local SQLite database...');
    const { open } = await import('sqlite');
    const sqlite3 = (await import('sqlite3')).default;
    const sqliteDb = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await sqliteDb.exec('PRAGMA foreign_keys = ON');
    db = new SqliteAdapter(sqliteDb);
  }

  // Schema creation script
  let schemaSql = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      firstName TEXT,
      lastName TEXT,
      avatar TEXT,
      role TEXT DEFAULT 'viewer',
      subscriptionPlan TEXT DEFAULT 'free',
      stripeCustomerId TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Projects table
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      genre TEXT,
      targetPlatform TEXT,
      blueprint JSONB,
      economy JSONB,
      progression JSONB,
      psychology JSONB,
      simulation JSONB,
      auditResults JSONB,
      systems JSONB,
      analytics JSONB,
      workbook JSONB,
      knowledgeBase JSONB,
      settings JSONB,
      systemHealth INTEGER DEFAULT 85,
      blueprintComplete INTEGER DEFAULT 50,
      criticalRisks INTEGER DEFAULT 0,
      openDecisions INTEGER DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    -- AI Conversations table
    CREATE TABLE IF NOT EXISTS aiConversations (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      userId TEXT NOT NULL,
      messages JSONB,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    -- Recommendations table
    CREATE TABLE IF NOT EXISTS recommendations (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      agent TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      affectedSystems JSONB,
      confidence INTEGER,
      status TEXT DEFAULT 'pending',
      appliedAt TIMESTAMP,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id)
    );

    -- Subscriptions table
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      stripeSubscriptionId TEXT UNIQUE,
      plan TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      currentPeriodStart TIMESTAMP,
      currentPeriodEnd TIMESTAMP,
      cancelAtPeriodEnd BOOLEAN DEFAULT false,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    -- Billing history table
    CREATE TABLE IF NOT EXISTS billingHistory (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      subscriptionId TEXT,
      amount INTEGER,
      currency TEXT DEFAULT 'usd',
      status TEXT,
      invoiceId TEXT,
      description TEXT,
      stripeEventId TEXT UNIQUE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (subscriptionId) REFERENCES subscriptions(id)
    );

    -- Exports table
    CREATE TABLE IF NOT EXISTS exports (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      format TEXT NOT NULL,
      fileName TEXT,
      fileUrl TEXT,
      status TEXT DEFAULT 'completed',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id)
    );

    -- Audit logs table
    CREATE TABLE IF NOT EXISTS auditLogs (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      projectId TEXT,
      action TEXT NOT NULL,
      resource TEXT,
      details JSONB,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (projectId) REFERENCES projects(id)
    );

    -- Agent Plans table
    CREATE TABLE IF NOT EXISTS agent_plans (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      prompt TEXT NOT NULL,
      plannerSummary TEXT,
      status TEXT DEFAULT 'pending',
      confidence INTEGER DEFAULT 90,
      reasoning TEXT,
      requiresApproval BOOLEAN DEFAULT false,
      tokenUsage INTEGER DEFAULT 0,
      durationMs INTEGER DEFAULT 0,
      errorMessage TEXT,
      modelUsed TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id)
    );

    -- Plan Steps table
    CREATE TABLE IF NOT EXISTS plan_steps (
      id TEXT PRIMARY KEY,
      planId TEXT NOT NULL,
      stepIndex INTEGER NOT NULL,
      agentRole TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      confidence INTEGER DEFAULT 90,
      durationMs INTEGER DEFAULT 0,
      output TEXT,
      affectedSystems JSONB,
      toolCalls JSONB,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (planId) REFERENCES agent_plans(id)
    );

    -- Project Memory table
    CREATE TABLE IF NOT EXISTS project_memory (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata JSONB,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id)
    );

    -- Conversation Memory table
    CREATE TABLE IF NOT EXISTS conversation_memory (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      role TEXT NOT NULL,
      text TEXT NOT NULL,
      metadata JSONB,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id)
    );

    -- Proposals table
    CREATE TABLE IF NOT EXISTS proposals (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      planId TEXT,
      agentRole TEXT NOT NULL,
      summary TEXT NOT NULL,
      affectedSystems JSONB,
      diff JSONB,
      status TEXT DEFAULT 'pending',
      appliedAt TIMESTAMP,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id),
      FOREIGN KEY (planId) REFERENCES agent_plans(id)
    );

    -- Version History table
    CREATE TABLE IF NOT EXISTS version_history (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      versionNumber INTEGER NOT NULL,
      summary TEXT NOT NULL,
      snapshot JSONB NOT NULL,
      proposalId TEXT,
      createdBy TEXT,
      environment TEXT DEFAULT 'sandbox',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id),
      FOREIGN KEY (proposalId) REFERENCES proposals(id)
    );

    -- Telemetry Aggregates table (daily computed metrics — privacy-safe)
    CREATE TABLE IF NOT EXISTS telemetry_aggregates (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      aggregateDate DATE NOT NULL,
      metricName TEXT NOT NULL,
      metricValue NUMERIC,
      cohort TEXT,
      sampleSize INTEGER DEFAULT 0,
      computedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(projectId, aggregateDate, metricName, cohort)
    );

    -- Telemetry Quarantine table (invalid events rejected from ingestion)
    CREATE TABLE IF NOT EXISTS telemetry_quarantine (
      id TEXT PRIMARY KEY,
      projectId TEXT,
      rawPayload JSONB,
      errorReason TEXT,
      receivedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Password Reset Tokens table
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      tokenHash TEXT NOT NULL,
      expiresAt TIMESTAMP NOT NULL,
      usedAt TIMESTAMP,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Workspace Invitations table
    CREATE TABLE IF NOT EXISTS workspace_invitations (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    );

    -- Project Members table (multi-tenant RBAC mapping)
    CREATE TABLE IF NOT EXISTS project_members (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      userId TEXT NOT NULL,
      role TEXT DEFAULT 'editor',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(projectId, userId)
    );

    -- Telemetry Events table (anonymized game event ingestion pipeline)
    CREATE TABLE IF NOT EXISTS telemetry_events (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      eventName TEXT NOT NULL,
      playerId TEXT NOT NULL,
      sessionId TEXT NOT NULL,
      timestamp TIMESTAMP NOT NULL,
      gameVersion TEXT,
      platform TEXT,
      region TEXT,
      playerLevel INTEGER DEFAULT 0,
      segment TEXT,
      properties JSONB DEFAULT '{}',
      ingestedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    );

    -- Import Sessions table (tracks 12-category data import validation results)
    CREATE TABLE IF NOT EXISTS import_sessions (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      status TEXT DEFAULT 'incomplete',
      summary TEXT,
      details JSONB,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_telemetry_events_projectId ON telemetry_events(projectId);
    CREATE INDEX IF NOT EXISTS idx_telemetry_events_playerId ON telemetry_events(playerId);
    CREATE INDEX IF NOT EXISTS idx_telemetry_events_eventName ON telemetry_events(eventName);
    CREATE INDEX IF NOT EXISTS idx_import_sessions_projectId ON import_sessions(projectId);
    CREATE INDEX IF NOT EXISTS idx_project_members_projectId ON project_members(projectId);
    CREATE INDEX IF NOT EXISTS idx_project_members_userId ON project_members(userId);
    CREATE INDEX IF NOT EXISTS idx_projects_userId ON projects(userId);
    CREATE INDEX IF NOT EXISTS idx_aiConversations_projectId ON aiConversations(projectId);
    CREATE INDEX IF NOT EXISTS idx_recommendations_projectId ON recommendations(projectId);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_userId ON subscriptions(userId);
    CREATE INDEX IF NOT EXISTS idx_billingHistory_userId ON billingHistory(userId);
    CREATE INDEX IF NOT EXISTS idx_exports_projectId ON exports(projectId);
    CREATE INDEX IF NOT EXISTS idx_auditLogs_userId ON auditLogs(userId);
    CREATE INDEX IF NOT EXISTS idx_agent_plans_projectId ON agent_plans(projectId);
    CREATE INDEX IF NOT EXISTS idx_plan_steps_planId ON plan_steps(planId);
    CREATE INDEX IF NOT EXISTS idx_proposals_projectId ON proposals(projectId);
    CREATE INDEX IF NOT EXISTS idx_version_history_projectId ON version_history(projectId);
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_userId ON password_reset_tokens(userId);
    CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token ON workspace_invitations(token);
  `;

  if (isPostgres) {
    // PostgreSQL uses boolean values true/false rather than integer 1/0 for boolean columns
    schemaSql = schemaSql
      .replace(/BOOLEAN DEFAULT 0/g, 'BOOLEAN DEFAULT false')
      .replace(/BOOLEAN DEFAULT 1/g, 'BOOLEAN DEFAULT true');
  }

  await db.exec(schemaSql);

  // Ensure new columns exist on existing databases (idempotent ALTER TABLE)
  const alterations: Array<{ table: string; column: string; type: string }> = [
    { table: 'projects', column: 'systems', type: 'JSONB' },
    { table: 'projects', column: 'analytics', type: 'JSONB' },
    { table: 'projects', column: 'workbook', type: 'JSONB' },
    { table: 'projects', column: 'knowledgeBase', type: 'JSONB' },
    { table: 'projects', column: 'settings', type: 'JSONB' },
    { table: 'agent_plans', column: 'tokenUsage', type: 'INTEGER DEFAULT 0' },
    { table: 'agent_plans', column: 'durationMs', type: 'INTEGER DEFAULT 0' },
    { table: 'agent_plans', column: 'errorMessage', type: 'TEXT' },
    { table: 'agent_plans', column: 'modelUsed', type: 'TEXT' },
    { table: 'version_history', column: 'environment', type: "TEXT DEFAULT 'sandbox'" },
    { table: 'billingHistory', column: 'stripeEventId', type: 'TEXT' },
  ];
  for (const { table, column, type } of alterations) {
    try {
      await db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type};`);
    } catch {
      // Column already exists — expected on all non-first runs
    }
  }

  return db;
}

export function getDatabase(): DatabaseInterface {
  if (!db) throw new Error('Database not initialized');
  return db;
}
