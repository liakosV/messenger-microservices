import { LogOut, MessageCircle, Settings } from 'lucide-react';
import type { Profile } from '../../profile/model/types';
import { Avatar } from '../../../shared/components/Avatar';
interface Props {
  profile: Profile;
  onHome: () => void;
  onProfile: () => void;
  onLogout: () => void;
}
export function NavigationRail({ profile, onHome, onProfile, onLogout }: Props) {
  return (
    <nav className="rail" aria-label="Κύρια πλοήγηση">
      <span className="rail-logo">
        <MessageCircle size={24} />
      </span>
      <button
        className="rail-button active"
        title="Συνομιλίες"
        aria-label="Συνομιλίες"
        onClick={onHome}
      >
        <MessageCircle size={21} />
      </button>
      <div className="rail-bottom">
        <button className="rail-button" aria-label="Το προφίλ σου" onClick={onProfile}>
          <Settings size={21} />
        </button>
        <button className="rail-button" aria-label="Αποσύνδεση" onClick={onLogout}>
          <LogOut size={21} />
        </button>
        <Avatar label={profile.username} small />
      </div>
    </nav>
  );
}
