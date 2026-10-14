import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import * as api from '../api/participantApi';
import { useParticipantDirectory } from './useParticipantNames';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
it('refreshes renamed users and preserves known names through a temporary failure', async () => {
  vi.useFakeTimers();
  const resolver = vi.spyOn(api, 'resolveParticipantNames').mockResolvedValue({ other: 'maria' });
  const { result } = renderHook(() => useParticipantDirectory('token', ['other', 'other']));
  await act(async () => {});
  expect(result.current.names.other).toBe('maria');
  resolver.mockResolvedValue({ other: 'renamed' });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30_000);
  });
  expect(result.current.names.other).toBe('renamed');
  resolver.mockRejectedValue(new Error('offline'));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30_000);
  });
  expect(result.current.failed).toBe(true);
  expect(result.current.names.other).toBe('renamed');
});
it('aborts outstanding resolution on unmount', async () => {
  let signal: AbortSignal | undefined;
  vi.spyOn(api, 'resolveParticipantNames').mockImplementation(async (_token, _ids, inputSignal) => {
    signal = inputSignal;
    return {};
  });
  const { unmount } = renderHook(() => useParticipantDirectory('token', ['other']));
  await act(async () => {});
  unmount();
  expect(signal?.aborted).toBe(true);
});
