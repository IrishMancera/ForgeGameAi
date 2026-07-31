import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

let db: Database | null = null;

export async function initializeDatabase(dbPath: string): Promise<Database> {
  if (db) return db;

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec('PRAGMA foreign_keys = ON');

  // Create tables
  await db.exec(`
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
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
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
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    -- AI Conversations table
    CREATE TABLE IF NOT EXISTS aiConversations (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      userId TEXT NOT NULL,
      messages JSONB,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
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
      appliedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id)
    );

    -- Subscriptions table
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      stripeSubscriptionId TEXT UNIQUE,
      plan TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      currentPeriodStart DATETIME,
      currentPeriodEnd DATETIME,
      cancelAtPeriodEnd BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
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
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
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
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
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
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
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
      requiresApproval BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
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
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (planId) REFERENCES agent_plans(id)
    );

    -- Project Memory table
    CREATE TABLE IF NOT EXISTS project_memory (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata JSONB,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id)
    );

    -- Conversation Memory table
    CREATE TABLE IF NOT EXISTS conversation_memory (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      role TEXT NOT NULL,
      text TEXT NOT NULL,
      metadata JSONB,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
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
      appliedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
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
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(id),
      FOREIGN KEY (proposalId) REFERENCES proposals(id)
    );

    -- Password Reset Tokens table
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      tokenHash TEXT NOT NULL,
      expiresAt DATETIME NOT NULL,
      usedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Create indexes
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
  `);

  // Ensure new columns exist on existing databases
  const moduleCols = ['systems', 'analytics', 'workbook', 'knowledgeBase', 'settings'];
  for (const col of moduleCols) {
    try {
      await db.exec(`ALTER TABLE projects ADD COLUMN ${col} JSONB;`);
    } catch {
      // Column already exists
    }
  }

  return db;
}

export function getDatabase(): Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}
