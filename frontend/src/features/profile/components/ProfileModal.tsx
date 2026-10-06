import type { Profile } from '../model/types';
import { Avatar } from '../../../shared/components/Avatar';
import { CopyId } from '../../../shared/components/CopyId';
import { Modal } from '../../../shared/components/Modal';
import { useProfileForm } from '../hooks/useProfileForm';
interface Props {
  profile: Profile;
  token: string;
  close: () => void;
  updated: (profile: Profile) => void;
  logout: () => void;
  onError: (error: unknown) => void;
}
export function ProfileModal({ profile, token, close, updated, logout, onError }: Props) {
  const { busy, error, deleting, submit, startDeleting } = useProfileForm({
    profile,
    token,
    close,
    updated,
    logout,
    onError,
  });
  return (
    <Modal title={deleting ? 'Διαγραφή λογαριασμού' : 'Το προφίλ σου'} close={close}>
      <form onSubmit={submit}>
        {deleting ? (
          <>
            <p className="muted">
              Ο λογαριασμός σου θα απενεργοποιηθεί και θα χάσεις την πρόσβαση στις συνομιλίες.
              Επιβεβαίωσε με τον κωδικό σου.
            </p>
            <label>
              Τρέχων κωδικός
              <input name="password" type="password" autoComplete="current-password" required />
            </label>
          </>
        ) : (
          <>
            <div className="profile-id">
              <Avatar label={profile.username} />
              <div>
                <strong>{profile.username}</strong>
                <p className="uuid-full">{profile.uuid}</p>
                <CopyId uuid={profile.uuid} />
              </div>
            </div>
            <label>
              Όνομα χρήστη
              <input
                name="username"
                defaultValue={profile.username}
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9._\-]+"
                required
              />
            </label>
            <label>
              Email
              <input
                name="email"
                type="email"
                defaultValue={profile.email}
                maxLength={255}
                required
              />
            </label>
            <div className="form-row">
              <label>
                Ημερομηνία γέννησης
                <input
                  name="dateOfBirth"
                  type="date"
                  defaultValue={profile.dateOfBirth}
                  max={new Date(Date.now() - 86400000).toISOString().slice(0, 10)}
                  required
                />
              </label>
              <label>
                Τηλέφωνο
                <input
                  name="phoneNumber"
                  defaultValue={profile.phoneNumber}
                  maxLength={255}
                  required
                />
              </label>
            </div>
            <label>
              Νέος κωδικός <span className="muted">· προαιρετικό</span>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Άφησέ το κενό για να κρατήσεις τον ίδιο"
              />
            </label>
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className={deleting ? 'danger wide' : 'primary wide'} disabled={busy}>
          {busy ? 'Περίμενε λίγο…' : deleting ? 'Οριστική απενεργοποίηση' : 'Αποθήκευση αλλαγών'}
        </button>
        {!deleting && (
          <>
            <button type="button" className="text-button wide" disabled={busy} onClick={logout}>
              Αποσύνδεση από τον λογαριασμό
            </button>
            <button
              type="button"
              className="text-button danger-text"
              disabled={busy}
              onClick={startDeleting}
            >
              Διαγραφή λογαριασμού
            </button>
          </>
        )}
      </form>
    </Modal>
  );
}
