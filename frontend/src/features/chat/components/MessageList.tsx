import { MessageBubble } from './MessageBubble';
import { ArrowUp, MessageCircle } from 'lucide-react';
import type { RefObject } from 'react';
import type { Message } from '../model/types';
import { dateLabel } from '../../../shared/utils/format';
interface Props {
  messages: Message[];
  callerUuid: string;
  loading: boolean;
  loadingOlder: boolean;
  messageError: string;
  olderPage: number;
  bottom: RefObject<HTMLDivElement | null>;
  onRefresh: () => void;
  onLoadOlder: () => void;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
}
export function MessageList({
  messages,
  callerUuid,
  loading,
  loadingOlder,
  messageError,
  olderPage,
  bottom,
  onRefresh,
  onLoadOlder,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="messages" aria-label="Ιστορικό μηνυμάτων" aria-busy={loading}>
      {loading ? (
        <p className="muted center">Φόρτωση μηνυμάτων…</p>
      ) : messageError ? (
        <div className="center">
          <p className="error">{messageError}</p>
          <button className="text-button" onClick={() => onRefresh()}>
            Δοκιμή ξανά
          </button>
        </div>
      ) : (
        <>
          {olderPage >= 0 && (
            <button className="older-button" disabled={loadingOlder} onClick={() => onLoadOlder()}>
              <ArrowUp size={13} />
              {loadingOlder ? 'Φόρτωση…' : 'Παλαιότερα μηνύματα'}
            </button>
          )}
          {!messages.length && (
            <div className="conversation-start">
              <span>
                <MessageCircle size={28} />
              </span>
              <h3>Κάθε κουβέντα έχει μια αρχή.</h3>
              <p>Πες το πρώτο «γεια».</p>
            </div>
          )}
          {messages.map((message, index) => {
            const mine = message.senderUuid === callerUuid;
            const previous = messages[index - 1];
            const showDate =
              !previous || previous.createdAt.slice(0, 10) !== message.createdAt.slice(0, 10);
            return (
              <div key={message.uuid}>
                {showDate && (
                  <div className="date-divider">
                    <span>{dateLabel(message.createdAt)}</span>
                  </div>
                )}
                <MessageBubble message={message} mine={mine} onEdit={onEdit} onDelete={onDelete} />
              </div>
            );
          })}
          <div ref={bottom} />
        </>
      )}
    </div>
  );
}
