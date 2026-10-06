import { useState, type FormEvent } from 'react';
import { ApiError } from '../../../shared/api/client';
import { errorMessage } from '../../../shared/utils/errors';
import { conversationApi } from '../api/conversationApi';
import { participantIds } from '../model/conversations';
import type { Conversation } from '../model/types';

interface Options {
  token: string;
  callerUuid: string;
  onCreated: (conversation: Conversation) => void;
  onError: (error: unknown) => void;
}
export function useNewConversation({ token, callerUuid, onCreated, onError }: Options) {
  const [newIds, setNewIds] = useState('');
  const [modalError, setModalError] = useState('');
  const [busy, setBusy] = useState(false);
  const create = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setModalError('');
    try {
      onCreated(await conversationApi.create(token, participantIds(newIds, callerUuid)));
    } catch (error) {
      setModalError(errorMessage(error));
      if (error instanceof ApiError && error.status === 401) onError(error);
    } finally {
      setBusy(false);
    }
  };
  return { newIds, setNewIds, modalError, busy, create };
}
