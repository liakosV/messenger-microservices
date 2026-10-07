import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import type { FormEvent } from 'react';
import { useNewConversation } from './useNewConversation';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const me = '11111111-1111-4111-8111-111111111111';
const maria = '22222222-2222-4222-8222-222222222222';
const bob = '33333333-3333-4333-8333-333333333333';
const event = { preventDefault() {} } as FormEvent;

it('resolves group usernames, deduplicates aliases by ID, and excludes the caller', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { uuid: me, username: 'alex' },
          { uuid: maria, username: 'Maria' },
          { uuid: maria, username: 'Maria' },
          { uuid: bob, username: 'bob' },
        ]),
      ),
    )
    .mockResolvedValueOnce(new Response(JSON.stringify({ uuid: 'conversation' })));
  vi.stubGlobal('fetch', fetcher);
  const onCreated = vi.fn();
  const { result } = renderHook(() =>
    useNewConversation({ token: 'token', callerUuid: me, onCreated, onError: vi.fn() }),
  );
  act(() => result.current.setNewIds('alex, Maria\nmaria; bob, bob'));
  await act(() => result.current.create(event));
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({
    usernames: ['alex', 'Maria', 'maria', 'bob'],
  });
  expect(fetcher.mock.calls[0][1].headers.Authorization).toBe('Bearer token');
  expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({ participantUuids: [maria, bob] });
  expect(onCreated).toHaveBeenCalledWith({ uuid: 'conversation' });
});

it.each([404, 401])(
  'does not create a conversation when username resolution returns %s',
  async (status) => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{}', { status }));
    vi.stubGlobal('fetch', fetcher);
    const onError = vi.fn(),
      onCreated = vi.fn();
    const { result } = renderHook(() =>
      useNewConversation({ token: 'token', callerUuid: me, onCreated, onError }),
    );
    act(() => result.current.setNewIds('missing'));
    await act(() => result.current.create(event));
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(onCreated).not.toHaveBeenCalled();
    expect(result.current.modalError).toBeTruthy();
    expect(onError).toHaveBeenCalledTimes(status === 401 ? 1 : 0);
  },
);

it('rejects self-only participants after resolution', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify([{ uuid: me, username: 'alex' }])));
  vi.stubGlobal('fetch', fetcher);
  const { result } = renderHook(() =>
    useNewConversation({ token: 'token', callerUuid: me, onCreated: vi.fn(), onError: vi.fn() }),
  );
  act(() => result.current.setNewIds('alex'));
  await act(() => result.current.create(event));
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(result.current.modalError).toContain('άλλον χρήστη');
});
