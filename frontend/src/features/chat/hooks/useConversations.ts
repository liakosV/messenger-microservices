import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../../../shared/api/client';
import { conversationApi } from '../api/conversationApi';
import { CONVERSATION_POLL_INTERVAL_MS } from '../config';
import type { ChatEvent, Conversation } from '../model/types';

export function useConversations(
  token: string,
  callerUuid: string,
  onError: (error: unknown) => void,
) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listPage, setListPage] = useState(0);
  const [moreConversations, setMoreConversations] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const activeId = useRef(selectedId);
  const generation = useRef(0);
  activeId.current = selectedId;

  const loadConversations = useCallback(
    async (page = 0, quiet = false) => {
      const id = ++generation.current;
      if (!quiet) setLoadingList(true);
      try {
        const data = await conversationApi.list(token, page);
        if (id !== generation.current) return;
        setConversations((existing) =>
          page === 0
            ? data.content
            : [
                ...existing,
                ...data.content.filter((item) => !existing.some((old) => old.uuid === item.uuid)),
              ],
        );
        setListPage(page);
        setMoreConversations(data.page + 1 < data.totalPages);

        // First-page refreshes must keep a selected conversation from a later page.
        const checkedId = activeId.current;
        if (checkedId && page === 0 && !data.content.some((item) => item.uuid === checkedId)) {
          const current = await conversationApi.get(token, checkedId).catch((error) => {
            if (error instanceof ApiError && [403, 404].includes(error.status)) {
              if (activeId.current === checkedId) setSelectedId(null);
              return null;
            }
            throw error;
          });
          if (id === generation.current && current) {
            setConversations((items) =>
              items.some((item) => item.uuid === current.uuid) ? items : [...items, current],
            );
          }
        }
      } catch (error) {
        if (id === generation.current) onError(error);
      } finally {
        if (id === generation.current) setLoadingList(false);
      }
    },
    [token, onError],
  );

  useEffect(() => {
    void loadConversations();
    const interval = setInterval(
      () => void loadConversations(0, true),
      CONVERSATION_POLL_INTERVAL_MS,
    );
    return () => {
      clearInterval(interval);
      generation.current++;
    };
  }, [loadConversations]);
  useEffect(() => {
    if (selectedId) setUnread((items) => ({ ...items, [selectedId]: 0 }));
  }, [selectedId]);

  const setPreview = useCallback((uuid: string, content: string) => {
    setPreviews((items) => ({ ...items, [uuid]: content }));
  }, []);
  const receiveActivity = useCallback(
    (event: ChatEvent) => {
      if (!event.conversationUuid) return;
      const uuid = event.conversationUuid;
      setPreview(uuid, event.message?.content || 'Το μήνυμα διαγράφηκε');
      if (
        uuid !== activeId.current &&
        event.type === 'MESSAGE_CREATED' &&
        event.message?.senderUuid !== callerUuid
      ) {
        setUnread((items) => ({ ...items, [uuid]: (items[uuid] || 0) + 1 }));
      }
    },
    [callerUuid, setPreview],
  );
  const addConversation = useCallback((conversation: Conversation) => {
    setConversations((items) => [
      conversation,
      ...items.filter((item) => item.uuid !== conversation.uuid),
    ]);
    setSelectedId(conversation.uuid);
  }, []);
  const removeConversation = useCallback((uuid: string) => {
    setSelectedId((current) => (current === uuid ? null : current));
    setConversations((items) => items.filter((item) => item.uuid !== uuid));
  }, []);

  return {
    conversations,
    selectedId,
    selected: conversations.find((item) => item.uuid === selectedId),
    activeId,
    listPage,
    moreConversations,
    loadingList,
    unread,
    previews,
    setSelectedId,
    loadConversations,
    setPreview,
    receiveActivity,
    addConversation,
    removeConversation,
  };
}
