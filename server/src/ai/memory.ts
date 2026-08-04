import { getDatabase } from '../models/schema.js';

export interface MemoryEntry {
  id: string;
  projectId: string;
  type: 'assumption' | 'accepted_recommendation' | 'rejected_recommendation' | 'decision' | 'version_note';
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ConversationTurn {
  id: string;
  projectId: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

class MemoryService {
  public async addConversationTurn(projectId: string, role: ConversationTurn['role'], text: string, metadata?: Record<string, unknown>): Promise<void> {
    const db = getDatabase();
    const id = `turn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await db.run(
      `INSERT INTO conversation_memory (id, projectId, role, text, metadata) VALUES (?, ?, ?, ?, ?)`,
      [id, projectId, role, text, JSON.stringify(metadata || {})]
    );
  }

  public async getRecentConversationHistory(projectId: string, limit: number = 10): Promise<Array<{ role: 'user' | 'assistant' | 'system'; text: string }>> {
    try {
      const db = getDatabase();
      const rows = await db.all(
        `SELECT role, text FROM conversation_memory WHERE projectId = ? ORDER BY createdAt DESC LIMIT ?`,
        [projectId, limit]
      );
      return rows.reverse().map((r) => ({ role: r.role, text: r.text }));
    } catch {
      return [];
    }
  }

  public async addProjectMemory(projectId: string, type: MemoryEntry['type'], content: string, metadata?: Record<string, unknown>): Promise<void> {
    const db = getDatabase();
    const id = `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await db.run(
      `INSERT INTO project_memory (id, projectId, type, content, metadata) VALUES (?, ?, ?, ?, ?)`,
      [id, projectId, type, content, JSON.stringify(metadata || {})]
    );
  }

  public async getProjectMemories(projectId: string): Promise<Array<{ type: string; content: string; metadata?: Record<string, unknown> }>> {
    try {
      const db = getDatabase();
      const rows = await db.all(
        `SELECT type, content, metadata FROM project_memory WHERE projectId = ? ORDER BY createdAt DESC LIMIT 20`,
        [projectId]
      );
      return rows.map((r) => ({
        type: r.type,
        content: r.content,
        metadata: r.metadata ? JSON.parse(r.metadata) : undefined,
      }));
    } catch {
      return [];
    }
  }
}

export const memoryService = new MemoryService();
