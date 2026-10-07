import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, request } from './client';
import { mergeMessages } from '../../features/chat/model/messages';
import { participantIds } from '../../features/chat/model/conversations';
import type { Message } from '../../features/chat/model/types';

afterEach(() => vi.unstubAllGlobals());
const me = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
describe('participants and message reconciliation', () => {
  it('deduplicates participant UUIDs and excludes the caller', () => {
    expect(participantIds(`${me}, ${other.toUpperCase()}\n${other}`, me)).toEqual([other]);
    expect(() => participantIds('a random user', me)).toThrow();
    expect(() => participantIds(me, me)).toThrow();
  });
  it('reconciles REST and WebSocket copies without duplicates and retains updates', () => {
    const a = { uuid: 'a', createdAt: '2026-10-06T10:00:00', content: 'original' } as Message;
    const b = { uuid: 'b', createdAt: '2026-10-06T10:01:00', content: 'second' } as Message;
    expect(mergeMessages([b, a], [{ ...a, content: 'edited' }])).toEqual([
      { ...a, content: 'edited' },
      b,
    ]);
  });
});
describe('API requests', () => {
  it('forwards bearer credentials, handles 204 and translates invalid participants', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ detail: 'One or more participants do not exist or are inactive' }),
          { status: 400 },
        ),
      );
    vi.stubGlobal('fetch', fetcher);
    await expect(
      request('/chat/api/conversations/one', 'token', { method: 'DELETE' }),
    ).resolves.toBeUndefined();
    expect(fetcher.mock.calls[0][1].headers.Authorization).toBe('Bearer token');
    await expect(request('/chat/api/conversations', 'token')).rejects.toMatchObject({
      status: 400,
      message: 'Ένας ή περισσότεροι συμμετέχοντες δεν έχουν ενεργό λογαριασμό.',
    });
  });
  it('reports outages and authentication failures without rendering raw server errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response('SQL private details', { status: 503 }))
        .mockResolvedValueOnce(new Response(null, { status: 401 })),
    );
    await expect(request('/chat/api/conversations')).rejects.toMatchObject({ status: 503 });
    await expect(request('/chat/api/conversations')).rejects.toBeInstanceOf(ApiError);
  });
});
