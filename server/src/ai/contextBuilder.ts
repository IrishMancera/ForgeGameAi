import { AIContext } from './types';
import { ragEngine } from './ragEngine';
import { memoryService } from './memory';
import { dependencyGraph } from './dependencyGraph';
import { getDatabase } from '../models/schema';

export class ContextBuilder {
  public async buildContext(
    projectId: string,
    activeWorkspace: string,
    userPrompt: string,
    moduleSnapshot?: unknown
  ): Promise<AIContext> {
    let snapshot: Record<string, unknown> | null = null;
    let version = 1;

    try {
      const db = getDatabase();
      const projectRow = await db.get(`SELECT * FROM projects WHERE id = ? LIMIT 1`, [projectId]);
      if (projectRow) {
        snapshot = projectRow;
      }
      const versionRow = await db.get(`SELECT MAX(versionNumber) as latest FROM version_history WHERE projectId = ?`, [projectId]);
      if (versionRow && versionRow.latest) {
        version = versionRow.latest;
      }
    } catch {
      snapshot = { name: 'Haunted Hotel', genre: 'Gacha RPG', systemHealth: 85 };
    }

    if (moduleSnapshot && typeof moduleSnapshot === 'object') {
      snapshot = { ...(snapshot || {}), liveModuleData: moduleSnapshot };
    }

    const conversationHistory = await memoryService.getRecentConversationHistory(projectId, 6);
    const projectMemory = await memoryService.getProjectMemories(projectId);
    const ragChunks = ragEngine.search(userPrompt, projectId, activeWorkspace, 3).map((chunk) => ({
      documentId: chunk.documentId,
      documentType: chunk.fileType,
      snippet: chunk.snippet,
      score: 0.92,
    }));

    return {
      projectId,
      activeWorkspace: activeWorkspace || 'command-center',
      projectSnapshot: snapshot,
      recentChanges: [
        { timestamp: new Date().toISOString(), action: 'MODULE_INSPECTED', details: `Workspace ${activeWorkspace} queried` },
      ],
      conversationHistory,
      projectMemory,
      ragChunks,
      dependencyMap: dependencyGraph.getGraphRepresentation(),
      userRole: 'lead_designer',
      projectVersion: version,
    };
  }
}

export const contextBuilder = new ContextBuilder();
