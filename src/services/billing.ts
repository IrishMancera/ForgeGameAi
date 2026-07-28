import { apiFetch } from './api';

export async function createCheckout(plan: 'solo' | 'studio' | 'enterprise') {
  return apiFetch<{ sessionUrl: string }>('/api/billing/checkout', { method: 'POST', body: { plan } });
}

export async function openBillingPortal() {
  return apiFetch<{ url: string }>('/api/billing/portal', { method: 'POST' });
}
