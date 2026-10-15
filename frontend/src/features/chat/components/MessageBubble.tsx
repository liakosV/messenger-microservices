import { CheckCheck, Check, Pencil, Trash2 } from 'lucide-react';
import { time } from '../../../shared/utils/format';
import { useParticipantNames } from '../hooks/useParticipantNames';
import { participantLabel } from '../model/conversations';
import type { Message } from '../model/types';
interface Props {
  message: Message;
  mine: boolean;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
}
export function MessageBubble({ message, mine, onEdit, onDelete }: Props) {
  const { names } = useParticipantNames();
  return (
    <article className={`message-row ${mine ? 'mine' : ''}`}>
      <div className="message-content">
        {!mine && <span className="sender">{participantLabel(message.senderUuid, names)}</span>}
        <div className="bubble">
          <p>{message.content}</p>
          <div className="message-meta">
            {message.editedAt && <span>επεξεργασμένο · </span>}
            <time dateTime={message.createdAt}>{time(message.createdAt)}</time>
            {mine && <span className="receipt-status" aria-live="polite">
              {message.readBy?.length ? <><CheckCheck size={13} /> Διαβάστηκε</> :
                message.deliveredTo?.length ? <><CheckCheck size={13} /> Παραδόθηκε</> :
                  <><Check size={13} /> Στάλθηκε</>}
            </span>}
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
