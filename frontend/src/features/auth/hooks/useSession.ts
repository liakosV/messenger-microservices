import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../../shared/api/client';
import { errorMessage } from '../../../shared/utils/errors';
import { profileApi } from '../../profile/api/profileApi';
import type { Profile } from '../../profile/model/types';
import { clearSession, restoreSession, saveSession, type Session } from '../model/session';

export function useSession() {
  const [session, setSession] = useState<Session | null>(restoreSession);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionError, setSessionError] = useState('');
  const [retry, setRetry] = useState(0);
  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    setProfile(null);
    setSessionError('');
  }, []);
  const signedIn = useCallback((token: string, expiresIn: number) => {
    setSession(saveSession(token, expiresIn));
  }, []);

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    setSessionError('');
    profileApi
      .get(session.token, controller.signal)
      .then((current) => {
        if (!controller.signal.aborted) setProfile(current);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && [401, 404].includes(error.status)) logout();
        else setSessionError(errorMessage(error));
      });
    const timer = setTimeout(logout, Math.max(0, session.expiresAt - Date.now()));
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [session, retry, logout]);

  return {
    session,
    profile,
    sessionError,
    setProfile,
    signedIn,
    logout,
    retryProfile: () => setRetry((value) => value + 1),
  };
}
