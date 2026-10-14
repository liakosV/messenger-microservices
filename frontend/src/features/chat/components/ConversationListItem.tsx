import { useParticipantNames } from '../hooks/useParticipantNames';
import type { Profile } from '../../profile/model/types';
import type { Conversation } from '../model/types';

import { titleFor } from '../model/conversations';
import { Avatar } from '../../../shared/components/Avatar';
interface Props {
  item: Conversation;
  profile: Profile;
  selectedId: string | null;
  preview?: string;
  unreadCount: number;
  onSelect: (uuid: string) => void;
}
export function ConversationListItem({
  item,
  profile,
  selectedId,
  preview,
  unreadCount,
  onSelect,
}: Props) {
  const { names } = useParticipantNames();
  return (
    <button
      className={`conversation ${selectedId === item.uuid ? 'selected' : ''}`}
      key={item.uuid}
      onClick={() => onSelect(item.uuid)}
    >
      <Avatar label={item.participantUuids.length > 2 ? 'ΟΜ' : titleFor(item, profile, names)} />
      <div className="conversation-text">
        <div>
          <strong>{titleFor(item, profile, names)}</strong>
          <span className="conversation-date">
            {new Date(item.createdAt).toLocaleDateString('el-GR', {
              day: '2-digit',
              month: '2-digit',
            })}
          </span>
        </div>
        <p>
          {preview || `${item.participantUuids.length} συμμετέχοντες · Ας ξεκινήσει η κουβέντα`}
        </p>
      </div>
      {unreadCount > 0 && <span className="unread">{unreadCount}</span>}
    </button>
  );
}
