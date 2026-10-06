import { useState } from 'react';
import { errorMessage } from '../utils/errors';

export interface Confirmation {
  title: string;
  description: string;
  action: () => Promise<void>;
}
export function useConfirmation(onError: (error: unknown) => void) {
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ask = (value: Confirmation) => {
    setError('');
    setConfirmation(value);
  };
  const close = () => {
    if (!busy) setConfirmation(null);
  };
  const execute = async () => {
    if (!confirmation || busy) return;
    setBusy(true);
    setError('');
    try {
      await confirmation.action();
      setConfirmation(null);
    } catch (failure) {
      setError(errorMessage(failure));
      onError(failure);
    } finally {
      setBusy(false);
    }
  };
  return { confirmation, busy, error, ask, close, execute };
}
