import { Check, Pencil, Trash2 } from 'lucide-react';
import { shortId, time } from '../../../shared/utils/format';
import type { Message } from '../model/types';
interface Props {
  message: Message;
  mine: boolean;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
}
export function MessageBubble({ message, mine, onEdit, onDelete }: Props) {
  return (
    <article className={`message-row ${mine ? 'mine' : ''}`}>
      <div className="message-content">
        {!mine && <span className="sender">Χρήστης {shortId(message.senderUuid)}</span>}
        <div className="bubble">
          <p>{message.content}</p>
          <div className="message-meta">
            {message.updatedAt !== message.createdAt && <span>επεξεργασμένο · </span>}
            <time dateTime={message.createdAt}>{time(message.createdAt)}</time>
            {mine && <Check size={13} aria-label="Αποθηκεύτηκε" />}
          </div>
        </div>
      </div>
      {mine && (
        <div className="message-actions">
          <button
            className="icon-button"
            aria-label="Επεξεργασία μηνύματος"
            onClick={() => {
              onEdit(message);
            }}
          >
            <Pencil size={13} />
          </button>
          <button
            className="icon-button"
            aria-label="Διαγραφή μηνύματος"
            onClick={() => onDelete(message)}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </article>
  );
}
