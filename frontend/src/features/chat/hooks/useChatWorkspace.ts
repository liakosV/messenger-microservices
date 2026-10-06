import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../../shared/api/client';
import { useConfirmation } from '../../../shared/hooks/useConfirmation';
import { errorMessage } from '../../../shared/utils/errors';
import { profileApi } from '../../profile/api/profileApi';
import { conversationApi } from '../api/conversationApi';
import { useChatRealtime } from './useChatRealtime';
import { useConversations } from './useConversations';
import { useMessages } from './useMessages';

export function useChatWorkspace(token: string, callerUuid: string, logout: () => void) {
  const [notice, setNotice] = useState('');
  const onError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) logout();
      else setNotice(errorMessage(error));
    },
    [logout],
  );
  const conversations = useConversations(token, callerUuid, onError);
  const { activeId, setSelectedId, loadConversations, setPreview, receiveActivity } = conversations;
  const onUnavailable = useCallback(() => {
    setSelectedId(null);
    void loadConversations(0, true);
  }, [setSelectedId, loadConversations]);
  const messages = useMessages({
    token,
    selectedId: conversations.selectedId,
    activeId,
    onError,
    onUnavailable,
    onPreview: setPreview,
  });
  const { receiveEvent, loadLatest } = messages;
  const confirmation = useConfirmation(onError);

  const realtime = useChatRealtime({
    token,
    onEvent: (event) => {
      if (!event.conversationUuid || !event.messageUuid) return;
      receiveActivity(event);
      receiveEvent(event);
      void loadConversations(0, true);
    },
    onConnected: () => {
      void loadConversations(0, true);
      if (activeId.current) void loadLatest(activeId.current, true);
    },
    onRejected: async () => {
      try {
        await profileApi.get(token);
        setNotice('Η σύνδεση ειδοποιήσεων έκλεισε. Δοκίμασε επανασύνδεση.');
      } catch (error) {
        if (error instanceof ApiError && [401, 404].includes(error.status)) logout();
        else onError(error);
      }
    },
  });
  useEffect(() => {
    const resume = () => {
      if (document.visibilityState !== 'visible') return;
      void loadConversations(0, true);
      if (activeId.current) void loadLatest(activeId.current, true);
    };
    document.addEventListener('visibilitychange', resume);
    return () => document.removeEventListener('visibilitychange', resume);
  }, [activeId, loadConversations, loadLatest]);

  const removeConversation = (remove: boolean) => {
    if (!conversations.selected) return;
    const uuid = conversations.selected.uuid;
    confirmation.ask({
      title: remove ? 'Διαγραφή συνομιλίας;' : 'Αποχώρηση από τη συνομιλία;',
      description: remove
        ? 'Η συνομιλία και όλα τα μηνύματα θα διαγραφούν για όλους τους συμμετέχοντες. Αυτή η ενέργεια δεν αναιρείται.'
        : 'Θα χάσεις πρόσβαση σε αυτή τη συνομιλία. Τα μηνύματα παραμένουν διαθέσιμα στα υπόλοιπα μέλη.',
      action: async () => {
        if (remove) await conversationApi.delete(token, uuid);
        else await conversationApi.leave(token, uuid);
        conversations.removeConversation(uuid);
      },
    });
  };
  return {
    conversations,
    messages,
    realtime,
    confirmation,
    notice,
    clearNotice: () => setNotice(''),
    onError,
    removeConversation,
  };
}
