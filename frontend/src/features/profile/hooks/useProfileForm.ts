import { useState, type FormEvent } from 'react';
import { errorMessage } from '../../../shared/utils/errors';
import { profileApi } from '../api/profileApi';
import { buildProfilePatch } from '../model/profilePatch';
import type { Profile } from '../model/types';

interface Options {
  profile: Profile;
  token: string;
  close: () => void;
  updated: (profile: Profile) => void;
  logout: () => void;
  onError: (error: unknown) => void;
}
export function useProfileForm({ profile, token, close, updated, logout, onError }: Options) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (deleting) {
        await profileApi.deactivate(token, String(values.password));
        logout();
      } else {
        updated(await profileApi.update(token, buildProfilePatch(values, profile)));
        close();
      }
    } catch (failure) {
      setError(errorMessage(failure));
      if (!deleting) onError(failure);
    } finally {
      setBusy(false);
    }
  };
  return {
    busy,
    error,
    deleting,
    submit,
    startDeleting: () => {
      setDeleting(true);
      setError('');
    },
  };
}
