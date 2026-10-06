import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { ApiError } from '../../../shared/api/client';
import { errorMessage } from '../../../shared/utils/errors';
import { messageApi } from '../api/messageApi';
import { mergeMessages } from '../model/messages';
import type { ChatEvent, Message } from '../model/types';

interface Options {
  token: string;
  selectedId: string | null;
  activeId: RefObject<string | null>;
  onError: (error: unknown) => void;
  onUnavailable: () => void;
  onPreview: (uuid: string, content: string) => void;
}
export function useMessages({
  token,
  selectedId,
  activeId,
  onError,
  onUnavailable,
  onPreview,
}: Options) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [olderPage, setOlderPage] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [messageError, setMessageError] = useState('');
  const bottom = useRef<HTMLDivElement>(null);
  const generation = useRef(0);
  const scrollNext = useRef(false);
  // Track mutations received during a fetch so old responses cannot resurrect deleted messages.
  const changes = useRef(new Map<string, Message | null>());

  const loadLatest = useCallback(
    async (uuid: string, quiet = false) => {
      const id = ++generation.current;
      if (!quiet) {
        setLoading(true);
        setMessageError('');
      }
      changes.current.clear();
      try {
        const first = await messageApi.list(token, uuid);
        const last =
          first.totalPages > 1 ? await messageApi.list(token, uuid, first.totalPages - 1) : first;
        if (id !== generation.current || activeId.current !== uuid) return;
        const items = new Map(last.content.map((message) => [message.uuid, message]));
        changes.current.forEach((message, key) => {
          if (message) items.set(key, message);
          else items.delete(key);
        });
        scrollNext.current = !quiet;
        setMessages(mergeMessages([], [...items.values()]));
        setOlderPage(last.page - 1);
        setMessageError('');
        if (last.content.length) onPreview(uuid, last.content.at(-1)!.content);
      } catch (error) {
        if (id !== generation.current || activeId.current !== uuid) return;
        if (error instanceof ApiError && [403, 404].includes(error.status)) onUnavailable();
        else {
          setMessageError(errorMessage(error));
          onError(error);
        }
      } finally {
        if (id === generation.current) setLoading(false);
      }
    },
    [token, activeId, onError, onUnavailable, onPreview],
  );

  useEffect(() => {
    setMessages([]);
    setOlderPage(-1);
    changes.current.clear();
    if (selectedId) void loadLatest(selectedId);
    return () => {
      generation.current++;
    };
  }, [selectedId, loadLatest]);
  useEffect(() => {
    if (scrollNext.current) {
      bottom.current?.scrollIntoView?.({ behavior: 'smooth' });
      scrollNext.current = false;
    }
  }, [messages]);

  const loadOlder = async () => {
    if (!selectedId || olderPage < 0) return;
    const uuid = selectedId,
      id = generation.current;
    setLoadingOlder(true);
    try {
      const data = await messageApi.list(token, uuid, olderPage);
      if (activeId.current === uuid && id === generation.current) {
        const incoming = data.content
          .filter((message) => changes.current.get(message.uuid) !== null)
          .map((message) => changes.current.get(message.uuid) || message);
        setMessages((items) => mergeMessages(incoming, items));
        setOlderPage(data.page - 1);
      }
    } catch (error) {
      onError(error);
    } finally {
      setLoadingOlder(false);
    }
  };
  const receiveEvent = useCallback(
    (event: ChatEvent) => {
      if (!event.messageUuid || event.conversationUuid !== activeId.current) return;
      changes.current.set(
        event.messageUuid,
        event.type === 'MESSAGE_DELETED' ? null : event.message || null,
      );
      if (event.type === 'MESSAGE_CREATED') scrollNext.current = true;
      setMessages((items) =>
        event.type === 'MESSAGE_DELETED'
          ? items.filter((item) => item.uuid !== event.messageUuid)
          : event.message
            ? mergeMessages(items, [event.message])
            : items,
      );
    },
    [activeId],
  );
  const send = async (content: string, editing: Message | null) => {
    if (!selectedId) return;
    const uuid = selectedId;
    const message = editing
      ? await messageApi.edit(token, uuid, editing.uuid, content)
      : await messageApi.send(token, uuid, content);
    if (activeId.current === uuid) {
      changes.current.set(message.uuid, message);
      scrollNext.current = !editing;
      setMessages((items) => mergeMessages(items, [message]));
    }
    onPreview(uuid, message.content);
  };
  const deleteMessage = async (message: Message) => {
    await messageApi.delete(token, message.conversationUuid, message.uuid);
    if (activeId.current === message.conversationUuid) {
      changes.current.set(message.uuid, null);
      setMessages((items) => items.filter((item) => item.uuid !== message.uuid));
    }
  };
  return {
    messages,
    olderPage,
    loading,
    loadingOlder,
    messageError,
    bottom,
    loadLatest,
    loadOlder,
    receiveEvent,
    send,
    deleteMessage,
  };
}
