export interface Session {
  token: string;
  expiresAt: number;
}
const SESSION_KEY = 'messenger.session';

export function restoreSession(): Session | null {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (!stored || typeof stored !== 'object') return null;
    const session = stored as Partial<Session>;
    if (
      typeof session.token !== 'string' ||
      typeof session.expiresAt !== 'number' ||
      !Number.isFinite(session.expiresAt) ||
      session.expiresAt <= Date.now()
    )
      return null;
    return { token: session.token, expiresAt: session.expiresAt };
  } catch {
    return null;
  }
}
export function saveSession(token: string, expiresIn: number): Session {
  const session = { token, expiresAt: Date.now() + expiresIn * 1000 };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}
export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
