import { Pencil, Send, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Message } from '../model/types';
import { useMessageComposer } from '../hooks/useMessageComposer';
interface Props {
  editing: Message | null;
  loading: boolean;
  onCancelEditing: () => void;
  onSend: (content: string, editing: Message | null) => Promise<void>;
  onError: (error: unknown) => void;
}
export function MessageComposer({ editing, loading, onCancelEditing, onSend, onError }: Props) {
  const { draft, setDraft, sending, send, cancelEditing } = useMessageComposer({
    editing,
    onCancelEditing,
    onSend,
    onError,
  });
  const textarea = useRef<HTMLTextAreaElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const restoreFocus = useRef(false);
  const [completedSend, setCompletedSend] = useState(0);
  useEffect(() => {
    // ActiveConversation is keyed by conversation UUID: focus only on opening/switching.
    if (!document.querySelector('dialog[open]')) textarea.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (sending) {
      const moved = (event: Event) => {
        if (
          !form.current?.contains(event.target as Node) &&
          (event.type !== 'focusin' || event.target !== document.body)
        )
          restoreFocus.current = false;
      };
      const leftWindow = () => {
        restoreFocus.current = false;
      };
      document.addEventListener('focusin', moved);
      document.addEventListener('pointerdown', moved);
      window.addEventListener('blur', leftWindow);
      return () => {
        document.removeEventListener('focusin', moved);
        document.removeEventListener('pointerdown', moved);
        window.removeEventListener('blur', leftWindow);
      };
    }
    if (!restoreFocus.current) return;
    restoreFocus.current = false;
    if (
      !document.querySelector('dialog[open]') &&
      document.visibilityState !== 'hidden' &&
      (document.activeElement === document.body || form.current?.contains(document.activeElement))
    ) {
      textarea.current?.focus({ preventScroll: true });
    }
  }, [sending, completedSend]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading || sending || !draft.trim()) return;
    restoreFocus.current = !!form.current?.contains(document.activeElement);
    await send(event);
    setCompletedSend((value) => value + 1);
  };
  return (
    <div className="composer-wrap">
      {editing && (
        <div className="editing-banner">
          <Pencil size={15} />
          Επεξεργασία μηνύματος
          <button className="icon-button" aria-label="Ακύρωση επεξεργασίας" onClick={cancelEditing}>
            <X size={16} />
          </button>
        </div>
      )}
      <form className="composer" ref={form} onSubmit={submit}>
        <textarea
          ref={textarea}
          aria-label="Μήνυμα"
          placeholder="Γράψε κάτι όμορφο…"
          maxLength={2000}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          readOnly={sending || loading}
          aria-busy={sending || loading}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              if (draft.trim()) void submit(event);
            }
          }}
          rows={2}
        />
        <button
          className="send-button"
          aria-label={editing ? 'Αποθήκευση μηνύματος' : 'Αποστολή μηνύματος'}
          disabled={!draft.trim() || sending || loading}
        >
          <Send size={19} />
        </button>
      </form>
      <div className="composer-note">
        <span>Enter για αποστολή · Shift + Enter για νέα γραμμή</span>
        <span>{draft.length}/2000</span>
      </div>
    </div>
  );
}
