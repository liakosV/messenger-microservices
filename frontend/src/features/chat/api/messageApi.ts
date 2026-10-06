import { json, request } from '../../../shared/api/client';
import type { Page } from '../../../shared/api/types';
import { MESSAGE_PAGE_SIZE } from '../config';
import type { Message } from '../model/types';

const messagesPath = (conversationUuid: string) =>
  `/chat/api/conversations/${conversationUuid}/messages`;
export const messageApi = {
  list: (token: string, conversationUuid: string, page = 0) =>
    request<Page<Message>>(
      `${messagesPath(conversationUuid)}?page=${page}&size=${MESSAGE_PAGE_SIZE}`,
      token,
    ),
  send: (token: string, conversationUuid: string, content: string) =>
    request<Message>(messagesPath(conversationUuid), token, json({ content })),
  edit: (token: string, conversationUuid: string, messageUuid: string, content: string) =>
    request<Message>(
      `${messagesPath(conversationUuid)}/${messageUuid}`,
      token,
      json({ content }, 'PATCH'),
    ),
  delete: (token: string, conversationUuid: string, messageUuid: string) =>
    request<void>(`${messagesPath(conversationUuid)}/${messageUuid}`, token, { method: 'DELETE' }),
};
