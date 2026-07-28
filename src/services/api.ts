const API_BASE = import.meta.env.VITE_API_BASE || '';

interface ApiOptions extends RequestInit {
  body?: any;
}

function buildHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = localStorage.getItem('gameforge_token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...buildHeaders(),
      ...(options.headers || {}),
    },
    body: options.body != null ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(data?.error || data?.message || 'Request failed');
  }

  return data as T;
}
