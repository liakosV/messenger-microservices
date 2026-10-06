import { useEffect, useState, type FormEvent } from 'react';
import type { Message } from '../model/types';

interface Options {
  editing: Message | null;
  onCancelEditing: () => void;
  onSend: (content: string, editing: Message | null) => Promise<void>;
  onError: (error: unknown) => void;
}
export function useMessageComposer({ editing, onCancelEditing, onSend, onError }: Options) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  useEffect(() => {
    setDraft(editing?.content || '');
  }, [editing]);
  const cancelEditing = () => {
    onCancelEditing();
    setDraft('');
  };
  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim() || sending) return;
    const content = draft;
    setSending(true);
    try {
      await onSend(content.trim(), editing);
      setDraft((current) => (current === content ? '' : current));
      if (editing) onCancelEditing();
    } catch (error) {
      onError(error);
    } finally {
      setSending(false);
    }
  };
  return { draft, setDraft, sending, send, cancelEditing };
}
