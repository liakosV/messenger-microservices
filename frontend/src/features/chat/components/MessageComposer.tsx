import { Pencil, Send, X } from 'lucide-react';
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
      <form className="composer" onSubmit={send}>
        <textarea
          aria-label="Μήνυμα"
          placeholder="Γράψε κάτι όμορφο…"
          maxLength={2000}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={sending || loading}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              if (draft.trim()) void send(event);
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
