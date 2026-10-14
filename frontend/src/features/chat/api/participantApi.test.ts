import { afterEach, expect, it, vi } from 'vitest';
import { resolveParticipantNames } from './participantApi';

afterEach(() => vi.unstubAllGlobals());
it('deduplicates IDs and resolves bounded batches with bearer authentication', async () => {
  const ids = Array.from({ length: 205 }, (_, index) => `user-${index}`);
  const fetcher = vi.fn(async (_path: string, options: RequestInit) => {
    const batch = JSON.parse(String(options.body)).userUuids as string[];
    return new Response(JSON.stringify(batch.map((uuid) => ({ uuid, username: `name-${uuid}` }))));
  });
  vi.stubGlobal('fetch', fetcher);
  const names = await resolveParticipantNames('token', [...ids, ids[0]]);
  expect(fetcher).toHaveBeenCalledTimes(3);
  expect(
    fetcher.mock.calls.map((call) => JSON.parse(String(call[1].body)).userUuids.length),
  ).toEqual([100, 100, 5]);
  expect(fetcher.mock.calls[0][1].headers).toEqual(
    expect.objectContaining({ Authorization: 'Bearer token' }),
  );
  expect(names['user-204']).toBe('name-user-204');
});
it('does not request empty batches or trust users outside the requested IDs', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify([{ uuid: 'unrequested', username: 'spoofed' }])),
    );
  vi.stubGlobal('fetch', fetcher);
  expect(await resolveParticipantNames('token', [])).toEqual({});
  expect(fetcher).not.toHaveBeenCalled();
  expect(await resolveParticipantNames('token', ['requested'])).toEqual({});
});
