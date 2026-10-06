import { json, request } from '../../../shared/api/client';
import type { Profile, ProfilePatch } from '../model/types';

const profilePath = '/identity/api/users/me';
export const profileApi = {
  get: (token: string, signal?: AbortSignal) => request<Profile>(profilePath, token, { signal }),
  update: (token: string, patch: ProfilePatch) =>
    request<Profile>(profilePath, token, json(patch, 'PATCH')),
  deactivate: (token: string, password: string) =>
    request<void>(profilePath, token, json({ password }, 'DELETE')),
};
