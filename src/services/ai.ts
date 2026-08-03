import { apiFetch } from './api';

export interface RecommendationRequest {
  projectId: string;
  prompt: string;
}

export interface AIFeedbackRequest {
  projectId: string;
  recommendationId: string;
  action: 'apply' | 'reject' | 'edit';
}

export async function requestRecommendation(projectId: string, prompt: string) {
  return apiFetch('/api/ai/recommendation', { method: 'POST', body: { projectId, prompt } });
}

export async function sendAIFeedback(projectId: string, recommendationId: string, action: 'apply' | 'reject' | 'edit') {
  return apiFetch('/api/ai/feedback', { method: 'POST', body: { projectId, recommendationId, action } });
}

export async function aiChat(projectId: string, prompt: string): Promise<string> {
  const response = await apiFetch<{ message: string }>('/api/ai/chat', { method: 'POST', body: { projectId, prompt } });
  return response.message;
}
