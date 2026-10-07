import { ArrowUp } from 'lucide-react';
import { Modal } from '../../../shared/components/Modal';
import type { Conversation } from '../model/types';
import { useNewConversation } from '../hooks/useNewConversation';
interface Props {
  token: string;
  callerUuid: string;
  close: () => void;
  onCreated: (conversation: Conversation) => void;
  onError: (error: unknown) => void;
}
export function NewConversationModal({ token, callerUuid, close, onCreated, onError }: Props) {
  const { newIds, setNewIds, modalError, busy, create } = useNewConversation({
    token,
    callerUuid,
    onCreated,
    onError,
  });
  return (
    <Modal title="Μια καινούρια κουβέντα" close={close}>
      <p className="muted">
        Γράψε το όνομα χρήστη του άλλου μέλους. Για ομάδα, πρόσθεσε περισσότερα ονόματα.
      </p>
      <form onSubmit={create}>
        <label>
          Ονόματα χρήστη συμμετεχόντων
          <textarea
            value={newIds}
            onChange={(event) => setNewIds(event.target.value)}
            placeholder="π.χ. alex, maria"
            rows={4}
            required
          />
        </label>
        <p className="field-note">Χωρισμένα με κόμμα ή νέα γραμμή. Προστίθεσαι αυτόματα.</p>
        {modalError && (
          <p className="error" role="alert">
            {modalError}
          </p>
        )}
        <button className="primary wide" disabled={busy}>
          {busy ? 'Έλεγχος συμμετεχόντων…' : 'Ξεκίνα τη συνομιλία'}
          <ArrowUp size={16} />
        </button>
      </form>
    </Modal>
  );
}
