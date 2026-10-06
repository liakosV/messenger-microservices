import type { Confirmation } from '../hooks/useConfirmation';
import { Modal } from './Modal';

interface Props {
  confirmation: Confirmation;
  busy: boolean;
  error: string;
  close: () => void;
  execute: () => void;
}
export function ConfirmationModal({ confirmation, busy, error, close, execute }: Props) {
  return (
    <Modal title={confirmation.title} close={close}>
      <p className="muted">{confirmation.description}</p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="confirm-actions">
        <button className="secondary" disabled={busy} onClick={close}>
          Ακύρωση
        </button>
        <button className="danger" disabled={busy} onClick={execute}>
          {busy ? 'Περίμενε λίγο…' : 'Επιβεβαίωση'}
        </button>
      </div>
    </Modal>
  );
}
