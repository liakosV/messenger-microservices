import type { Profile } from '../../profile/model/types';
import type { Conversation } from '../model/types';
import { shortId } from '../../../shared/utils/format';
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
  return (
    <button
      className={`conversation ${selectedId === item.uuid ? 'selected' : ''}`}
      key={item.uuid}
      onClick={() => onSelect(item.uuid)}
    >
      <Avatar
        label={
          item.participantUuids.length > 2
            ? 'ΟΜ'
            : shortId(item.participantUuids.find((id) => id !== profile.uuid) || item.uuid)
        }
      />
      <div className="conversation-text">
        <div>
          <strong>{titleFor(item, profile)}</strong>
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
