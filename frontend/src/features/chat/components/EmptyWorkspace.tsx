import { Info, MessageCircle, Plus } from 'lucide-react';
export function EmptyWorkspace({ onNew }: { onNew: () => void }) {
  return (
    <div className="welcome">
      <div className="welcome-art">
        <div className="orbit-ring" />
        <span className="welcome-icon">
          <MessageCircle size={49} strokeWidth={1.4} />
        </span>
        <span className="floating-note one">γεια σου.</span>
        <span className="floating-note two">ας τα πούμε ↗</span>
        <span className="spark">✳</span>
      </div>
      <span className="eyebrow">ΚΑΝΕ ΧΩΡΟ ΓΙΑ ΜΙΑ ΚΟΥΒΕΝΤΑ</span>
      <h2>
        Οι άνθρωποί σου,
        <br />
        λίγο πιο κοντά.
      </h2>
      <p>
        Διάλεξε μια συνομιλία ή ξεκίνα μια καινούρια.
        <br />
        Τα υπόλοιπα είναι μια κουβέντα μακριά.
      </p>
      <button className="primary" onClick={onNew}>
        <Plus size={18} />
        Νέα συνομιλία
      </button>
      <span className="welcome-footnote">
        <Info size={14} />
        Τα μηνύματα εμφανίζονται σε πραγματικό χρόνο.
      </span>
    </div>
  );
}
