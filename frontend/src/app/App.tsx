import { AuthScreen } from '../features/auth/components/AuthScreen';
import { useSession } from '../features/auth/hooks/useSession';
import { ChatWorkspace } from '../features/chat/components/ChatWorkspace';
import { Brand } from '../shared/components/Brand';

export default function App() {
  const { session, profile, sessionError, setProfile, signedIn, logout, retryProfile } =
    useSession();
  if (!session) return <AuthScreen signedIn={signedIn} />;
  if (!profile) {
    return (
      <main className="boot-screen">
        <Brand />
        {sessionError ? (
          <>
            <p className="error" role="alert">
              {sessionError}
            </p>
            <button className="primary" onClick={retryProfile}>
              Δοκιμή ξανά
            </button>
            <button className="text-button" onClick={logout}>
              Πίσω στη σύνδεση
            </button>
          </>
        ) : (
          <p className="muted">Ετοιμάζουμε τον χώρο σου…</p>
        )}
      </main>
    );
  }
  return (
    <ChatWorkspace
      key={session.token}
      token={session.token}
      profile={profile}
      setProfile={setProfile}
      logout={logout}
    />
  );
}
