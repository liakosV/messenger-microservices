import { MessageCircle } from 'lucide-react';

export function Brand() {
  return (
    <div className="brand">
      <span className="brand-symbol">
        <MessageCircle size={23} strokeWidth={2} />
      </span>
      <span>
        messenger<span className="brand-dot">.</span>
      </span>
    </div>
  );
}
