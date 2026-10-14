import { Modal } from '../../../shared/components/Modal';
import { Avatar } from '../../../shared/components/Avatar';
import { CopyId } from '../../../shared/components/CopyId';
import { participantLabel } from '../model/conversations';
import { useParticipantNames } from '../hooks/useParticipantNames';
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
  const { names, failed } = useParticipantNames();
  return (
    <Modal title="Οι συμμετέχοντες" close={close}>
      <p className="muted">{selected.participantUuids.length} μέλη σε αυτή τη συνομιλία.</p>
      {failed && (
        <p className="muted" role="status">
          Τα ονόματα δεν ανανεώθηκαν. Θα γίνει νέα προσπάθεια αυτόματα.
        </p>
      )}
      <div className="members">
        {selected.participantUuids.map((uuid) => (
          <div className="member" key={uuid}>
            <Avatar
              label={uuid === profile.uuid ? profile.username : participantLabel(uuid, names)}
              small
            />
            <div>
              <strong>
                {uuid === profile.uuid
                  ? `${profile.username} · εσύ`
                  : participantLabel(uuid, names)}
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
