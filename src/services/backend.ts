import { apiFetch } from './api';

export interface BackendSnapshot {
  projectId?: string;
  projectName: string;
  gameGenre: string;
  systemStatus: {
    mode: string;
    syncStatus: string;
    uptime: string;
    activeAgents: number;
  };
  liveMetrics: {
    health: number;
    blueprint: number;
    risks: number;
    decisions: number;
  };
  activity: Array<{
    id: number;
    title: string;
    detail: string;
    tone: 'success' | 'info' | 'warning';
  }>;
}

const fallbackSnapshot: BackendSnapshot = {
  projectName: 'Haunted Hotel',
  gameGenre: 'Hybrid-Casual Tycoon',
  systemStatus: {
    mode: 'Live Ops Mode',
    syncStatus: 'Syncing 5 agents',
    uptime: '99.98%',
    activeAgents: 5,
  },
  liveMetrics: {
    health: 91,
    blueprint: 86,
    risks: 2,
    decisions: 7,
  },
  activity: [
    {
      id: 1,
      title: 'Evolution loop stabilized',
      detail: 'Economy and retention curves now align for day-7 retention.',
      tone: 'success',
    },
    {
      id: 2,
      title: 'Audit scan complete',
      detail: 'Two high priority issues flagged for player fairness review.',
      tone: 'warning',
    },
    {
      id: 3,
      title: 'Simulation refreshed',
      detail: 'New cohort run with 500 players and live event pacing.',
      tone: 'info',
    },
  ],
};

export async function getBackendSnapshot(): Promise<BackendSnapshot> {
  try {
    const response = await apiFetch<{ projects: Array<{ name: string; genre?: string; systemHealth: number; blueprintComplete: number; criticalRisks: number; openDecisions: number; }>; }>(`/api/projects`);
    const project = response.projects[0];
    if (!project) return fallbackSnapshot;

    return {
      projectId: project.id,
      projectName: project.name,
      gameGenre: project.genre || 'Hybrid-Casual Tycoon',
      systemStatus: {
        mode: 'Live Ops Mode',
        syncStatus: 'Syncing 5 agents',
        uptime: '99.98%',
        activeAgents: 5,
      },
      liveMetrics: {
        health: project.systemHealth,
        blueprint: project.blueprintComplete,
        risks: project.criticalRisks,
        decisions: project.openDecisions,
      },
      activity: fallbackSnapshot.activity,
    };
  } catch {
    return fallbackSnapshot;
  }
}
