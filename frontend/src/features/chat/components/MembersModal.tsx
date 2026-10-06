import { Modal } from '../../../shared/components/Modal';
import { Avatar } from '../../../shared/components/Avatar';
import { CopyId } from '../../../shared/components/CopyId';
import { shortId } from '../../../shared/utils/format';
import type { Profile } from '../../profile/model/types';
import type { Conversation } from '../model/types';
export function MembersModal({
  selected,
  profile,
  close,
}: {
  selected: Conversation;
  profile: Profile;
  close: () => void;
}) {
  return (
    <Modal title="Οι συμμετέχοντες" close={close}>
      <p className="muted">{selected.participantUuids.length} μέλη σε αυτή τη συνομιλία.</p>
      <div className="members">
        {selected.participantUuids.map((uuid) => (
          <div className="member" key={uuid}>
            <Avatar label={uuid === profile.uuid ? profile.username : shortId(uuid)} small />
            <div>
              <strong>
                {uuid === profile.uuid ? `${profile.username} · εσύ` : `Χρήστης ${shortId(uuid)}`}
                {uuid === selected.creatorUuid && <span className="creator-label">Δημιουργός</span>}
              </strong>
              <p className="uuid-full">{uuid}</p>
            </div>
            <CopyId uuid={uuid} />
          </div>
        ))}
      </div>
    </Modal>
  );
}
