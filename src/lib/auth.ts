import { supabase } from './supabase';

const USER_KEY = 'perpus_user';

export interface StoredUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
}

// ── Session check ──────────────────────────────────────────────────────────

export async function initAuth(): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      clearUser();
      return;
    }
    // Refresh cached user from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profile) {
      setUser({
        id: session.user.id,
        username: profile.username ?? session.user.email ?? '',
        name: profile.name,
        email: session.user.email ?? '',
        role: profile.role,
      });
    }
  } catch {
    // fail silently on startup
  }
}

// ── Sync helpers (used by Router guards) ──────────────────────────────────

export function isAuthenticated(): boolean {
  return !!getUser();
}

export function getUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

export function setUser(user: StoredUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem(USER_KEY);
}

// kept for backward compat in some call sites
export const clearToken = clearUser;
export const setToken = (_token: string) => {};
export const getToken = () => getUser() ? 'supabase-session' : null;
export const getAuthHeaders = () => ({});
