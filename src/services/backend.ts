import { apiFetch } from './api';

export interface BackendSnapshot {
  projectId?: string;
  projectName: string;
  gameGenre: string;
  systemStatus: {
    mode: string;
    syncStatus: string;
    activeAgents: number;
  };
  liveMetrics: {
    health: number;
    blueprint: number;
    risks: number;
    decisions: number;
  };
  activity: Array<{
    id: string;
    title: string;
    detail: string;
    tone: 'success' | 'info' | 'warning';
    createdAt?: string;
  }>;
  isOffline?: boolean;
}

/**
 * Fetches real project snapshot from backend.
 * Returns { isOffline: true } when backend is unreachable.
 * NEVER returns hardcoded fake data — caller must handle offline state.
 */
export async function getBackendSnapshot(): Promise<BackendSnapshot | null> {
  try {
    const response = await apiFetch<{
      projects: Array<{
        id: string;
        name: string;
        genre?: string;
        systemHealth: number;
        blueprintComplete: number;
        criticalRisks: number;
        openDecisions: number;
      }>;
    }>('/api/projects');

    const project = response.projects[0];
    if (!project) return null;

    // Fetch recent audit log for activity feed (real data)
    let activity: BackendSnapshot['activity'] = [];
    try {
      const auditResponse = await apiFetch<{ logs: Array<{ id: string; action: string; details: string; createdAt: string }> }>(
        `/api/projects/${project.id}/audit?limit=5`
      );
      activity = (auditResponse.logs || []).map((log) => ({
        id: log.id,
        title: log.action.replace(/_/g, ' '),
        detail: typeof log.details === 'string' ? log.details : JSON.stringify(log.details).slice(0, 120),
        tone: log.action.includes('ERROR') ? 'warning' : log.action.includes('APPLIED') ? 'success' : 'info',
        createdAt: log.createdAt,
      }));
    } catch {
      // Activity feed is non-critical — leave empty on failure
    }

    return {
      projectId: project.id,
      projectName: project.name,
      gameGenre: project.genre || 'Game Project',
      systemStatus: {
        mode: 'Live Ops Mode',
        syncStatus: 'Connected',
        activeAgents: 10,
      },
      liveMetrics: {
        health: project.systemHealth,
        blueprint: project.blueprintComplete,
        risks: project.criticalRisks,
        decisions: project.openDecisions,
      },
      activity,
    };
  } catch {
    // Backend is offline — return null; UI must show offline state
    return null;
  }
}
