import { useState, type FormEvent } from 'react';
import { ApiError, request, json } from '../../../shared/api/client';
import { errorMessage } from '../../../shared/utils/errors';
import { conversationApi } from '../api/conversationApi';
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
      const usernames = [
        ...new Set(
          newIds
            .trim()
            .split(/[\s,;]+/)
            .filter(Boolean),
        ),
      ];
      if (
        !usernames.length ||
        usernames.length > 99 ||
        usernames.some((name) => !/^[a-zA-Z0-9._-]{3,30}$/.test(name))
      ) {
        throw new Error('Βάλε 1–99 έγκυρα ονόματα χρήστη, χωρισμένα με κόμμα ή νέα γραμμή.');
      }
      let users: { uuid: string; username: string }[];
      try {
        users = await request('/identity/api/users/resolve-usernames', token, json({ usernames }));
      } catch (error) {
        if (error instanceof ApiError && error.status === 404)
          throw new Error(
            'Ένα ή περισσότερα ονόματα χρήστη δεν βρέθηκαν. Έλεγξε την ορθογραφία και ότι ο λογαριασμός είναι ενεργός.',
          );
        throw error;
      }
      const ids = [...new Set(users.map((user) => user.uuid))].filter((id) => id !== callerUuid);
      if (!ids.length) throw new Error('Πρόσθεσε τουλάχιστον έναν άλλον χρήστη.');
      onCreated(await conversationApi.create(token, ids));
    } catch (error) {
      setModalError(errorMessage(error));
      if (error instanceof ApiError && error.status === 401) onError(error);
    } finally {
      setBusy(false);
    }
  };
  return { newIds, setNewIds, modalError, busy, create };
}
