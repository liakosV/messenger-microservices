export interface Conversation {
  uuid: string;
  creatorUuid: string;
  participantUuids: string[];
  createdAt: string;
  updatedAt: string;
}
export interface Message {
  uuid: string;
  conversationUuid: string;
  senderUuid: string;
  content: string;
  deliveredTo?: string[];
  readBy?: string[];
  editedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface ChatEvent {
  type: string;
  conversationUuid?: string;
  messageUuid?: string;
  message?: Message | null;
}
