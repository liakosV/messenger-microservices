import { RegistrationFields } from './RegistrationFields';
import { AuthStory } from './AuthStory';
import { ArrowRight } from 'lucide-react';
import { useAuthForm } from '../hooks/useAuthForm';
export function AuthScreen({ signedIn }: { signedIn: (token: string, expiresIn: number) => void }) {
  const { register, busy, error, success, submit, switchMode } = useAuthForm(signedIn);
  return (
    <main className="auth-page">
      <AuthStory />
      <section className="auth-panel">
        <div className="auth-card">
          <span className="eyebrow">ΚΑΛΩΣ ΗΡΘΕΣ ΣΤΟ MESSENGER</span>
          <h2>{register ? 'Ας γνωριστούμε.' : 'Χαίρομαι που είσαι εδώ.'}</h2>
          <p className="muted">
            {register
              ? 'Φτιάξε τον λογαριασμό σου και ξεκίνα μια κουβέντα.'
              : 'Συνδέσου και συνέχισε από εκεί που έμεινες.'}
          </p>
          <div className="auth-tabs">
            <button
              className={!register ? 'active' : ''}
              disabled={busy}
              onClick={() => switchMode(false)}
            >
              Σύνδεση
            </button>
            <button
              className={register ? 'active' : ''}
              disabled={busy}
              onClick={() => switchMode(true)}
            >
              Εγγραφή
            </button>
          </div>
          <form key={String(register)} onSubmit={submit}>
            {register ? (
              <RegistrationFields />
            ) : (
              <label>
                Όνομα χρήστη, email ή τηλέφωνο
                <input
                  name="identifier"
                  autoComplete="username"
                  placeholder="Πώς σε βρίσκουμε;"
                  maxLength={255}
                  required
                />
              </label>
            )}
            <label>
              Κωδικός
              <input
                name="password"
                type="password"
                autoComplete={register ? 'new-password' : 'current-password'}
                required
              />
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="success" role="status">
                {success}
              </p>
            )}
            <button className="primary wide" disabled={busy}>
              {busy
                ? 'Περίμενε λίγο…'
                : register
                  ? 'Δημιουργία λογαριασμού'
                  : 'Πάμε στις συνομιλίες'}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="auth-note">Οι συνομιλίες σου. Οι άνθρωποί σου. Ο χώρος σου.</p>
        </div>
      </section>
    </main>
  );
}
