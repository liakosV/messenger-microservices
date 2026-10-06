import { ConversationListItem } from './ConversationListItem';
import { ChevronDown, ChevronRight, MessageCircle, Plus, RefreshCw, Search } from 'lucide-react';
import type { Profile } from '../../profile/model/types';
import type { Conversation } from '../model/types';

import { titleFor } from '../model/conversations';
import { Avatar } from '../../../shared/components/Avatar';
import { Brand } from '../../../shared/components/Brand';
import { CopyId } from '../../../shared/components/CopyId';
interface Props {
  profile: Profile;
  conversations: Conversation[];
  selectedId: string | null;
  search: string;
  previews: Record<string, string>;
  unread: Record<string, number>;
  loadingList: boolean;
  moreConversations: boolean;
  onSelect: (uuid: string) => void;
  onSearch: (text: string) => void;
  onNew: () => void;
  onRefresh: () => void;
  onLoadMore: () => void;
  onProfile: () => void;
}
export function ConversationSidebar({
  profile,
  conversations,
  selectedId,
  search,
  previews,
  unread,
  loadingList,
  moreConversations,
  onSelect,
  onSearch,
  onNew,
  onRefresh,
  onLoadMore,
  onProfile,
}: Props) {
  const visible = conversations.filter((item) =>
    [titleFor(item, profile), item.uuid, item.participantUuids.join(' ')]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <aside className="sidebar">
      <header className="sidebar-brand">
        <Brand />
        <span className="pill">Ο ΧΩΡΟΣ ΣΟΥ</span>
      </header>
      <div className="sidebar-heading">
        <div>
          <span className="eyebrow">ΑΣ ΤΑ ΠΟΥΜΕ</span>
          <h1>
            Συνομιλίες<span className="count">{conversations.length}</span>
          </h1>
        </div>
        <button className="new-button" aria-label="Νέα συνομιλία" onClick={onNew}>
          <Plus size={21} />
        </button>
      </div>
      <label className="search">
        <Search size={17} />
        <input
          aria-label="Αναζήτηση συνομιλιών"
          placeholder="Βρες μια συνομιλία…"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
      </label>
      <div className="list-caption">
        <span>ΟΛΕΣ ΟΙ ΣΥΝΟΜΙΛΙΕΣ</span>
        <button className="icon-button" aria-label="Ανανέωση συνομιλιών" onClick={onRefresh}>
          <RefreshCw size={14} />
        </button>
      </div>
      <div className="conversation-list">
        {loadingList && !conversations.length ? (
          <p className="list-empty">Φόρτωση συνομιλιών…</p>
        ) : visible.length ? (
          visible.map((item) => (
            <ConversationListItem
              key={item.uuid}
              item={item}
              profile={profile}
              selectedId={selectedId}
              preview={previews[item.uuid]}
              unreadCount={unread[item.uuid] || 0}
              onSelect={onSelect}
            />
          ))
        ) : (
          <div className="list-empty">
            <MessageCircle size={26} />
            <p>{search ? 'Δεν βρέθηκε συνομιλία.' : 'Η πρώτη σου κουβέντα ξεκινά με ένα +.'}</p>
          </div>
        )}
        {moreConversations && (
          <button className="text-button" disabled={loadingList} onClick={onLoadMore}>
            Περισσότερες συνομιλίες <ChevronDown size={14} />
          </button>
        )}
      </div>
      <div className="sidebar-footer">
        <button className="user-card" onClick={onProfile}>
          <Avatar label={profile.username} small />
          <div>
            <strong>{profile.username}</strong>
            <span>Το προφίλ σου</span>
          </div>
          <ChevronRight size={16} />
        </button>
        <CopyId uuid={profile.uuid} />
      </div>
    </aside>
  );
}
