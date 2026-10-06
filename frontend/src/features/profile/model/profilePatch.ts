import type { Profile, ProfilePatch } from './types';

/** Omitted and unchanged fields preserve the existing profile, including password. */
export function buildProfilePatch(
  values: Record<string, FormDataEntryValue>,
  profile: Profile,
): ProfilePatch {
  const patch: ProfilePatch = {};
  const fields = ['username', 'email', 'dateOfBirth', 'phoneNumber', 'password'] as const;
  for (const field of fields) {
    const value = values[field];
    if (typeof value !== 'string' || value === '') continue;
    if (field === 'password' || value !== profile[field]) patch[field] = value;
  }
  return patch;
}
