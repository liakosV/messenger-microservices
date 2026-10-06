import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
export function CopyId({ uuid }: { uuid: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <button
      className="copy-id"
      title={uuid}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(uuid);
          setCopied(true);
          setFailed(false);
        } catch {
          setFailed(true);
        }
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}{' '}
      {copied ? 'Αντιγράφηκε' : failed ? uuid : 'Αντιγραφή UUID'}
    </button>
  );
}
