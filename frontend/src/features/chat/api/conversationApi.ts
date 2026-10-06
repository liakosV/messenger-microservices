import { json, request } from '../../../shared/api/client';
import type { Page } from '../../../shared/api/types';
import { CONVERSATION_PAGE_SIZE } from '../config';
import type { Conversation } from '../model/types';

const conversationPath = (uuid: string) => `/chat/api/conversations/${uuid}`;
export const conversationApi = {
  list: (token: string, page = 0) =>
    request<Page<Conversation>>(
      `/chat/api/conversations?page=${page}&size=${CONVERSATION_PAGE_SIZE}`,
      token,
    ),
  get: (token: string, uuid: string) => request<Conversation>(conversationPath(uuid), token),
  create: (token: string, participantUuids: string[]) =>
    request<Conversation>('/chat/api/conversations', token, json({ participantUuids })),
  leave: (token: string, uuid: string) =>
    request<void>(`${conversationPath(uuid)}/leave`, token, { method: 'POST' }),
  delete: (token: string, uuid: string) =>
    request<void>(conversationPath(uuid), token, { method: 'DELETE' }),
};
