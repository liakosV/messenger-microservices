import { ArrowLeft, LogOut, MoreHorizontal, RefreshCw, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import type { Profile } from '../../profile/model/types';
import type { Conversation } from '../model/types';
import { shortId } from '../../../shared/utils/format';
import { titleFor } from '../model/conversations';
import { Avatar } from '../../../shared/components/Avatar';
interface Props {
  selected: Conversation;
  profile: Profile;
  onBack: () => void;
  onMembers: () => void;
  onRefresh: () => void;
  onLeave: () => void;
  onDelete: () => void;
}
export function ChatHeader({
  selected,
  profile,
  onBack,
  onMembers,
  onRefresh,
  onLeave,
  onDelete,
}: Props) {
  const [menu, setMenu] = useState(false);
  return (
    <header className="chat-header">
      <button
        className="icon-button mobile-back"
        aria-label="Πίσω στις συνομιλίες"
        onClick={onBack}
      >
        <ArrowLeft size={20} />
      </button>
      <Avatar
        label={
          selected.participantUuids.length > 2
            ? 'ΟΜ'
            : shortId(selected.participantUuids.find((id) => id !== profile.uuid) || selected.uuid)
        }
      />
      <div className="chat-heading">
        <h2>{titleFor(selected, profile)}</h2>
        <span>{selected.participantUuids.length} συμμετέχοντες</span>
      </div>
      <button className="icon-button" aria-label="Συμμετέχοντες" onClick={onMembers}>
        <Users size={20} />
      </button>
      <div className="menu-wrap">
        <button
          className="icon-button"
          aria-label="Επιλογές συνομιλίας"
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          <MoreHorizontal size={22} />
        </button>
        {menu && (
          <div className="dropdown">
            <button
              onClick={() => {
                onRefresh();
                setMenu(false);
              }}
            >
              <RefreshCw size={15} />
              Ανανέωση μηνυμάτων
            </button>
            <button onClick={() => onLeave()}>
              <LogOut size={15} />
              Αποχώρηση
            </button>
            {selected.creatorUuid === profile.uuid && (
              <button className="danger-text" onClick={() => onDelete()}>
                <Trash2 size={15} />
                Διαγραφή για όλους
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
