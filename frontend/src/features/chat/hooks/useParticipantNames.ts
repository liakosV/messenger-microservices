import { createContext, useContext, useEffect, useState } from 'react';
import { resolveParticipantNames } from '../api/participantApi';

export const ParticipantNamesContext = createContext<{
  names: Record<string, string>;
  failed: boolean;
}>({ names: {}, failed: false });
export const useParticipantNames = () => useContext(ParticipantNamesContext);

export function useParticipantDirectory(token: string, ids: string[]) {
  const key = [...new Set(ids)].sort().join(',');
  const [state, setState] = useState({ names: {} as Record<string, string>, failed: false });
  useEffect(() => {
    const controller = new AbortController();
    let running = false;
    const load = async () => {
      if (running) return;
      running = true;
      try {
        const names = await resolveParticipantNames(
          token,
          key ? key.split(',') : [],
          controller.signal,
        );
        if (!controller.signal.aborted) setState({ names, failed: false });
      } catch {
        if (!controller.signal.aborted) setState((previous) => ({ ...previous, failed: true }));
      } finally {
        running = false;
      }
    };
    void load();
    const interval = setInterval(() => void load(), 30_000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [token, key]);
  return state;
}
