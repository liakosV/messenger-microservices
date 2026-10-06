import { useState, type FormEvent } from 'react';
import { errorMessage } from '../../../shared/utils/errors';
import { authApi } from '../api/authApi';

export function useAuthForm(signedIn: (token: string, expiresIn: number) => void) {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const switchMode = (registration: boolean) => {
    setRegister(registration);
    setError('');
    setSuccess('');
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    const data = new FormData(event.currentTarget);
    const field = (name: string) => String(data.get(name) || '');
    try {
      if (register) {
        await authApi.register({
          username: field('username'),
          email: field('email'),
          password: field('password'),
          dateOfBirth: field('dateOfBirth'),
          phoneNumber: field('phoneNumber'),
        });
        setRegister(false);
        setSuccess('Ο λογαριασμός σου είναι έτοιμος. Συνδέσου για να ξεκινήσεις.');
      } else {
        const auth = await authApi.login({
          identifier: field('identifier'),
          password: field('password'),
        });
        signedIn(auth.accessToken, auth.expiresIn);
      }
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };
  return { register, busy, error, success, switchMode, submit };
}
