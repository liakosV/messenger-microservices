import type { ConnectionState } from '../api/chatSocket';
export function ConnectionBar({
  connection,
  onReconnect,
}: {
  connection: ConnectionState;
  onReconnect: () => void;
}) {
  return (
    <div className="connection-bar">
      <span className={`status-dot ${connection}`} />
      <span>
        {connection === 'online'
          ? 'Συνδεδεμένος · Ζωντανές ειδοποιήσεις'
          : connection === 'connecting'
            ? 'Σύνδεση ειδοποιήσεων…'
            : 'Εκτός σύνδεσης · Τα μηνύματα στέλνονται μέσω REST'}
      </span>
      {connection === 'offline' && (
        <button className="text-button" onClick={onReconnect}>
          Επανασύνδεση
        </button>
      )}
      <span className="connection-right">ΜΙΑ ΚΟΥΒΕΝΤΑ ΤΗ ΦΟΡΑ</span>
    </div>
  );
}
