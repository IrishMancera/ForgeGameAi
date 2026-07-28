import { apiFetch } from './api';

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  subscriptionPlan: string;
  role: string;
  createdAt: string;
}

const TOKEN_KEY = 'gameforge_token';
const USER_KEY = 'gameforge_user';
const LOCAL_USERS_KEY = 'gameforge_local_users';

export interface AuthResponse {
  user: UserProfile;
  token: string;
  refreshToken: string;
}

interface LocalStoredUser {
  email: string;
  password: string;
  profile: UserProfile;
}

function shouldUseLocalFallback(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_USE_LOCAL_AUTH === 'true';
}

function buildLocalAuthResponse(email: string, password: string, firstName?: string, lastName?: string): AuthResponse {
  const safeEmail = email.trim().toLowerCase();
  const displayName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const profile: UserProfile = {
    id: `local-${Date.now()}`,
    email: safeEmail,
    firstName: firstName?.trim() || displayName || safeEmail.split('@')[0],
    lastName: lastName?.trim() || '',
    subscriptionPlan: 'pro',
    role: 'owner',
    createdAt: new Date().toISOString(),
  };

  const token = `local-${btoa(`${safeEmail}:${password}`)}`;
  return { user: profile, token, refreshToken: token };
}

function getLocalUsers(): LocalStoredUser[] {
  const raw = localStorage.getItem(LOCAL_USERS_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as LocalStoredUser[];
  } catch {
    return [];
  }
}

function saveLocalUsers(users: LocalStoredUser[]) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

function syncLocalUser(user: UserProfile, token: string): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser(): UserProfile | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveAuth(user: UserProfile, token: string): void {
  syncLocalUser(user, token);
}

export function clearAuth(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    return await apiFetch<AuthResponse>('/api/auth/login', { method: 'POST', body: { email, password } });
  } catch (error) {
    if (!shouldUseLocalFallback()) throw error;

    const localUsers = getLocalUsers();
    const existing = localUsers.find((entry) => entry.email === email.trim().toLowerCase());
    if (!existing) {
      throw new Error('No local account found. Please register first.');
    }

    if (existing.password !== password) {
      throw new Error('The password is incorrect.');
    }

    const response = buildLocalAuthResponse(existing.profile.email, password, existing.profile.firstName, existing.profile.lastName);
    response.user = existing.profile;
    syncLocalUser(response.user, response.token);
    return response;
  }
}

export async function register(email: string, password: string, firstName?: string, lastName?: string): Promise<AuthResponse> {
  try {
    return await apiFetch<AuthResponse>('/api/auth/register', { method: 'POST', body: { email, password, firstName, lastName } });
  } catch (error) {
    if (!shouldUseLocalFallback()) throw error;

    const cleanEmail = email.trim().toLowerCase();
    const localUsers = getLocalUsers();
    if (localUsers.some((entry) => entry.email === cleanEmail)) {
      throw new Error('An account with this email already exists.');
    }

    const response = buildLocalAuthResponse(cleanEmail, password, firstName, lastName);
    const nextUsers: LocalStoredUser[] = [
      ...localUsers,
      { email: cleanEmail, password, profile: response.user },
    ];
    saveLocalUsers(nextUsers);
    syncLocalUser(response.user, response.token);
    return response;
  }
}

export async function fetchCurrentUser(): Promise<{ user: UserProfile }> {
  try {
    return await apiFetch<{ user: UserProfile }>('/api/auth/me');
  } catch (error) {
    if (!shouldUseLocalFallback()) throw error;

    const storedUser = getStoredUser();
    if (!storedUser) {
      throw new Error('No active session');
    }

    return { user: storedUser };
  }
}
