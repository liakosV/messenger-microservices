import { useState } from 'react';
import { ConfirmationModal } from '../../../shared/components/ConfirmationModal';
import { Notice } from '../../../shared/components/Notice';
import { ProfileModal } from '../../profile/components/ProfileModal';
import type { Profile } from '../../profile/model/types';
import { useChatWorkspace } from '../hooks/useChatWorkspace';
import { ActiveConversation } from './ActiveConversation';
import { ConnectionBar } from './ConnectionBar';
import { ConversationSidebar } from './ConversationSidebar';
import { EmptyWorkspace } from './EmptyWorkspace';
import { MembersModal } from './MembersModal';
import { NavigationRail } from './NavigationRail';
import { NewConversationModal } from './NewConversationModal';

interface Props {
  token: string;
  profile: Profile;
  setProfile: (profile: Profile) => void;
  logout: () => void;
}
type ModalView = 'new' | 'profile' | 'members' | null;

/** Compose feature controllers and views; network and reconciliation logic live in hooks. */
export function ChatWorkspace({ token, profile, setProfile, logout }: Props) {
  const [modal, setModal] = useState<ModalView>(null);
  const [search, setSearch] = useState('');
  const {
    conversations,
    messages,
    realtime,
    confirmation,
    notice,
    clearNotice,
    onError,
    removeConversation,
  } = useChatWorkspace(token, profile.uuid, logout);
  const { selected, selectedId } = conversations;
  const closeModal = () => setModal(null);
  const openNew = () => setModal('new');
  const openProfile = () => setModal('profile');
  const home = () => conversations.setSelectedId(null);

  return (
    <main className={`workspace ${selectedId ? 'has-selection' : ''}`}>
      <NavigationRail profile={profile} onHome={home} onProfile={openProfile} onLogout={logout} />
      <ConversationSidebar
        profile={profile}
        conversations={conversations.conversations}
        selectedId={selectedId}
        search={search}
        previews={conversations.previews}
        unread={conversations.unread}
        loadingList={conversations.loadingList}
        moreConversations={conversations.moreConversations}
        onSelect={conversations.setSelectedId}
        onSearch={setSearch}
        onNew={openNew}
        onRefresh={() => void conversations.loadConversations()}
        onLoadMore={() => void conversations.loadConversations(conversations.listPage + 1)}
        onProfile={openProfile}
      />
      <section className="chat-panel" aria-label="Μηνύματα">
        <ConnectionBar connection={realtime.connection} onReconnect={realtime.reconnect} />
        {notice && <Notice notice={notice} close={clearNotice} />}
        {selected ? (
          <ActiveConversation
            key={selected.uuid}
            selected={selected}
            profile={profile}
            history={messages}
            onBack={home}
            onMembers={() => setModal('members')}
            onLeave={() => removeConversation(false)}
            onDelete={() => removeConversation(true)}
            onError={onError}
            onDeleteMessage={(message) =>
              confirmation.ask({
                title: 'Διαγραφή μηνύματος;',
                description: 'Το μήνυμα θα αφαιρεθεί για όλους τους συμμετέχοντες.',
                action: () => messages.deleteMessage(message),
              })
            }
          />
        ) : (
          <EmptyWorkspace onNew={openNew} />
        )}
      </section>
      {modal === 'new' && (
        <NewConversationModal
          token={token}
          callerUuid={profile.uuid}
          close={closeModal}
          onError={onError}
          onCreated={(conversation) => {
            conversations.addConversation(conversation);
            closeModal();
          }}
        />
      )}
      {modal === 'profile' && (
        <ProfileModal
          profile={profile}
          token={token}
          close={closeModal}
          updated={setProfile}
          logout={logout}
          onError={onError}
        />
      )}
      {modal === 'members' && selected && (
        <MembersModal selected={selected} profile={profile} close={closeModal} />
      )}
      {confirmation.confirmation && (
        <ConfirmationModal
          confirmation={confirmation.confirmation}
          busy={confirmation.busy}
          error={confirmation.error}
          close={confirmation.close}
          execute={() => void confirmation.execute()}
        />
      )}
    </main>
  );
}
