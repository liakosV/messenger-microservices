import { useState } from 'react';
import type { Profile } from '../../profile/model/types';
import type { useMessages } from '../hooks/useMessages';
import type { Conversation, Message } from '../model/types';
import { ChatHeader } from './ChatHeader';
import { MessageComposer } from './MessageComposer';
import { MessageList } from './MessageList';

interface Props {
  selected: Conversation;
  profile: Profile;
  history: ReturnType<typeof useMessages>;
  onBack: () => void;
  onMembers: () => void;
  onLeave: () => void;
  onDelete: () => void;
  onDeleteMessage: (message: Message) => void;
  onError: (error: unknown) => void;
}
export function ActiveConversation({
  selected,
  profile,
  history,
  onBack,
  onMembers,
  onLeave,
  onDelete,
  onDeleteMessage,
  onError,
}: Props) {
  const [editing, setEditing] = useState<Message | null>(null);
  const refresh = () => void history.loadLatest(selected.uuid);
  return (
    <>
      <ChatHeader
        selected={selected}
        profile={profile}
        onBack={onBack}
        onMembers={onMembers}
        onRefresh={refresh}
        onLeave={onLeave}
        onDelete={onDelete}
      />
      <MessageList
        messages={history.messages}
        callerUuid={profile.uuid}
        loading={history.loading}
        loadingOlder={history.loadingOlder}
        messageError={history.messageError}
        olderPage={history.olderPage}
        bottom={history.bottom}
        onRefresh={refresh}
        onLoadOlder={() => void history.loadOlder()}
        onEdit={setEditing}
        onDelete={onDeleteMessage}
      />
      <MessageComposer
        editing={editing}
        loading={history.loading}
        onCancelEditing={() => setEditing(null)}
        onSend={history.send}
        onError={onError}
      />
    </>
  );
}
