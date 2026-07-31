import { apiFetch } from './api';

export interface AppProject {
  id: string;
  userId: string;
  name: string;
  description?: string;
  genre?: string;
  targetPlatform?: string;
  systemHealth: number;
  blueprintComplete: number;
  criticalRisks: number;
  openDecisions: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectVersion {
  id: string;
  versionNumber: number;
  summary: string;
  proposalId?: string;
  createdBy?: string;
  createdAt: string;
}

export async function getProjects(): Promise<{ projects: AppProject[] }> {
  return apiFetch('/api/projects');
}

export async function createProject(name: string, genre?: string, targetPlatform?: string): Promise<{ project: AppProject }> {
  return apiFetch('/api/projects', { method: 'POST', body: { name, genre, targetPlatform } });
}

export async function updateProject(projectId: string, data: Partial<AppProject>): Promise<{ project: AppProject }> {
  return apiFetch(`/api/projects/${projectId}`, { method: 'PATCH', body: data });
}

export async function fetchProject(projectId: string): Promise<{ project: AppProject }> {
  return apiFetch(`/api/projects/${projectId}`);
}

export async function fetchProjectModule<T = any>(projectId: string, moduleName: string): Promise<{ module: string; data: T }> {
  return apiFetch(`/api/projects/${projectId}/modules/${moduleName}`);
}

export async function updateProjectModule<T = any>(projectId: string, moduleName: string, data: T): Promise<{ project: AppProject; module: string; data: T }> {
  return apiFetch(`/api/projects/${projectId}/modules/${moduleName}`, { method: 'PUT', body: data });
}

export async function fetchProjectHistory(projectId: string): Promise<{ versions: ProjectVersion[]; proposals: any[] }> {
  return apiFetch(`/api/projects/history?projectId=${encodeURIComponent(projectId)}`);
}
