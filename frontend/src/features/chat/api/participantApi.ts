import { json, request } from '../../../shared/api/client';

export interface ParticipantName {
  uuid: string;
  username: string;
}
/** One bounded request per batch, never one request per participant row. */
export async function resolveParticipantNames(token: string, ids: string[], signal?: AbortSignal) {
  const unique = [...new Set(ids)];
  const names: Record<string, string> = {};
  for (let start = 0; start < unique.length; start += 100) {
    const batch = unique.slice(start, start + 100);
    const users = await request<ParticipantName[]>('/identity/api/users/resolve-ids', token, {
      ...json({ userUuids: batch }),
      signal,
    });
    if (!Array.isArray(users)) throw new Error('Invalid participant names response');
    for (const user of users) {
      if (batch.includes(user.uuid) && typeof user.username === 'string' && user.username)
        names[user.uuid] = user.username;
    }
  }
  return names;
}
