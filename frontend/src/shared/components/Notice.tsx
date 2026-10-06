import { X } from 'lucide-react';
export function Notice({ notice, close }: { notice: string; close: () => void }) {
  return (
    <div className="notice" role="alert">
      <span>{notice}</span>
      <button className="icon-button" aria-label="Κλείσιμο ειδοποίησης" onClick={close}>
        <X size={17} />
      </button>
    </div>
  );
}
